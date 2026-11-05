"use server";

import { getConvexClient, api } from "./convex";
import {
  bmr,
  tdee,
  bmi,
  asianBmiBand,
  waistToHeight,
  screenFromAnswers,
  safetyMode as computeSafetyMode,
  gentleDeficitKcal,
} from "../lib/engine";

const DEFAULT_KEY = "default";

export async function getProfile(key: string = DEFAULT_KEY) {
  const client = getConvexClient();
  return (await client.query(api.db.getByKey, {
    table: "profiles",
    index: "by_key",
    field: "key",
    value: key,
  })) as any;
}

export async function getEnergy(key: string = DEFAULT_KEY) {
  const profile = await getProfile(key);
  if (!profile) return null;

  const bmrVal = bmr({
    weightKg: profile.weightKg,
    heightCm: profile.heightCm,
    age: profile.age,
    sex: profile.sex,
  });
  const tdeeVal = tdee(bmrVal, profile.activity);
  const floorVal = bmrVal;

  let target = tdeeVal;
  if (profile.safetyMode === "normal") {
    if (profile.goal === "gentle-change") {
      const deficit = profile.pace === "gentle" ? 300 : gentleDeficitKcal(0.5);
      target = Math.max(floorVal, tdeeVal - deficit);
    } else if (profile.goal === "build-strength") {
      target = tdeeVal + 200;
    }
  }

  return {
    bmr: Math.round(bmrVal),
    tdee: Math.round(tdeeVal),
    targetKcal: Math.round(target),
    floorKcal: Math.round(floorVal),
    safetyMode: profile.safetyMode,
    bmi: profile.asianBmi,
    bmiBand: profile.asianBmiBand,
  };
}

export async function saveProfile(args: {
  key?: string;
  name?: string;
  age: number;
  sex: "male" | "female";
  heightCm: number;
  weightKg: number;
  activity: "sedentary" | "light" | "moderate" | "active";
  goal: "maintain" | "gentle-change" | "build-strength";
  pace?: "steady" | "gentle";
  eatingStyle?: string[];
  budgetBandTaka?: number;
  household?: {
    eatersFromPot?: number;
    cooks?: string;
    mealsOutPerWeek?: number;
  };
  routine?: {
    commute?: "walk" | "rickshaw" | "bus" | "bike" | "cng";
    prayerTimes?: string[];
  };
  under18?: boolean;
  pregnancy?: boolean;
  insulinOrSulfonylurea?: boolean;
  heartOrKidneyDisease?: boolean;
  eatingDisorderHistory?: boolean;
  waistCm?: number;
  homeRegion?: string;
  calibratedPlate?: string;
  ricePortionLabel?: string;
  womenFriendlyPrivacy?: boolean;
  consent: boolean;
}) {
  const client = getConvexClient();
  const key = args.key ?? DEFAULT_KEY;

  const screen = screenFromAnswers({
    age: args.age,
    weightKg: args.weightKg,
    heightCm: args.heightCm,
    under18: args.under18,
    pregnancy: args.pregnancy,
    insulinOrSulfonylurea: args.insulinOrSulfonylurea,
    heartOrKidneyDisease: args.heartOrKidneyDisease,
    eatingDisorderHistory: args.eatingDisorderHistory,
  });
  const mode = computeSafetyMode(screen);
  const band = asianBmiBand(args.weightKg, args.heightCm);
  const bmiVal = bmi(args.weightKg, args.heightCm);
  const wth =
    args.waistCm && args.heightCm ? waistToHeight(args.waistCm, args.heightCm) : undefined;

  const now = Date.now();
  const fields = {
    key,
    name: args.name,
    age: args.age,
    sex: args.sex,
    heightCm: args.heightCm,
    weightKg: args.weightKg,
    activity: args.activity,
    goal: args.goal,
    pace: args.pace,
    safetyMode: mode,
    safetyScreen: {
      under18: screen.under18,
      pregnancy: screen.pregnancy,
      lowBmi: screen.lowBmi,
      insulinOrSulfonylurea: screen.insulinOrSulfonylurea,
      heartOrKidneyDisease: screen.heartOrKidneyDisease,
      eatingDisorderHistory: screen.eatingDisorderHistory,
    },
    asianBmi: bmiVal,
    asianBmiBand: band,
    waistCm: args.waistCm,
    waistToHeight: wth,
    eatingStyle: args.eatingStyle ?? [],
    budgetBandTaka: args.budgetBandTaka,
    household: args.household,
    routine: args.routine,
    homeRegion: args.homeRegion,
    calibratedPlate: args.calibratedPlate,
    ricePortionLabel: args.ricePortionLabel,
    womenFriendlyPrivacy: args.womenFriendlyPrivacy,
    consent: args.consent,
    consentAt: args.consent ? now : undefined,
    updatedAt: now,
  };

  const existing = await getProfile(key);
  if (existing) {
    await client.mutation(api.db.patch, { id: existing._id, doc: fields });
    return existing._id;
  }
  return await client.mutation(api.db.insert, {
    table: "profiles",
    doc: { ...fields, createdAt: now },
  });
}

export async function setBudgetControls(args: {
  key?: string;
  windowDays: number;
  intakeShare: number;
}) {
  const key = args.key ?? DEFAULT_KEY;
  const profile = await getProfile(key);
  if (!profile) throw new Error("Profile not found");

  const client = getConvexClient();
  return await client.mutation(api.db.patch, {
    id: profile._id,
    doc: {
      budgetControls: {
        windowDays: args.windowDays,
        intakeShare: args.intakeShare,
        updatedAt: Date.now(),
      },
    },
  });
}

export async function setWomenFriendlyPrivacy(args: {
  key?: string;
  enabled: boolean;
}) {
  const key = args.key ?? DEFAULT_KEY;
  const profile = await getProfile(key);
  if (!profile) throw new Error("Profile not found");

  const client = getConvexClient();
  return await client.mutation(api.db.patch, {
    id: profile._id,
    doc: {
      womenFriendlyPrivacy: args.enabled,
    },
  });
}

export async function saveFamilyMembers(args: {
  key?: string;
  members: Array<{
    id: string;
    name: string;
    relation: "child" | "teen" | "adult" | "elder";
    condition?: "diabetes" | "hypertension" | "none";
  }>;
}) {
  const key = args.key ?? DEFAULT_KEY;
  const profile = await getProfile(key);
  if (!profile) throw new Error("Profile not found");

  const cleanedMembers = args.members.map((m) => ({
    id: m.id,
    name: m.name,
    relation: m.relation,
    condition: m.condition === "none" ? undefined : m.condition,
  }));

  const client = getConvexClient();
  return await client.mutation(api.db.patch, {
    id: profile._id,
    doc: {
      familyMembers: cleanedMembers,
    },
  });
}

export async function clearProfileData(args: { key?: string } = {}) {
  const key = args.key ?? DEFAULT_KEY;
  const profile = await getProfile(key);
  const client = getConvexClient();

  if (profile) {
    await client.mutation(api.db.remove, { id: profile._id });
  }

  // Clear user's logs
  const tables = ["mealLogs", "activityLogs", "weighIns", "waterLogs"] as const;
  for (const table of tables) {
    const rows = (await client.query(api.db.find, {
      table,
      index: "by_profile_and_date",
      field: "profileKey",
      value: key,
    })) as Array<{ _id: string }>;
    for (const row of rows) {
      await client.mutation(api.db.remove, { id: row._id });
    }
  }

  return { ok: true };
}
