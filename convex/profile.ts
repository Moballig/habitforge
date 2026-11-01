import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  allowsDeficit,
  allowsExerciseCompensation,
  asianBmiBand,
  bmr,
  bmi,
  safetyMode as computeSafetyMode,
  screenFromAnswers,
  tdee,
  waistToHeight,
} from "../src/lib/engine";

const DEFAULT_KEY = "default";

const householdValidator = v.optional(
  v.object({
    cooks: v.optional(v.string()),
    eatersFromPot: v.optional(v.number()),
    mealsOutPerWeek: v.optional(v.number()),
  }),
);

const routineValidator = v.optional(
  v.object({
    commute: v.optional(
      v.union(
        v.literal("walk"),
        v.literal("rickshaw"),
        v.literal("bus"),
        v.literal("cng"),
        v.literal("bike"),
      ),
    ),
    prayerTimes: v.optional(v.array(v.string())),
  }),
);

export const get = query({
  args: { key: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const key = args.key ?? DEFAULT_KEY;
    return await ctx.db
      .query("profiles")
      .withIndex("by_key", (q) => q.eq("key", key))
      .unique();
  },
});

/**
 * Upsert profile. safetyMode is ALWAYS computed by the deterministic engine —
 * never accepted from the client or an LLM.
 */
export const save = mutation({
  args: {
    key: v.optional(v.string()),
    name: v.optional(v.string()),
    age: v.number(),
    sex: v.union(v.literal("male"), v.literal("female")),
    heightCm: v.number(),
    weightKg: v.number(),
    activity: v.union(
      v.literal("sedentary"),
      v.literal("light"),
      v.literal("moderate"),
      v.literal("active"),
    ),
    goal: v.union(
      v.literal("maintain"),
      v.literal("gentle-change"),
      v.literal("build-strength"),
    ),
    pace: v.optional(v.union(v.literal("steady"), v.literal("gentle"))),
    // Screening answers (booleans); engine derives mode
    under18: v.optional(v.boolean()),
    pregnancy: v.optional(v.boolean()),
    insulinOrSulfonylurea: v.optional(v.boolean()),
    heartOrKidneyDisease: v.optional(v.boolean()),
    eatingDisorderHistory: v.optional(v.boolean()),
    waistCm: v.optional(v.number()),
    eatingStyle: v.array(v.string()),
    budgetBandTaka: v.optional(v.number()),
    household: householdValidator,
    routine: routineValidator,
    homeRegion: v.optional(v.string()),
    calibratedPlate: v.optional(v.string()),
    ricePortionLabel: v.optional(v.string()),
    consent: v.boolean(),
  },
  handler: async (ctx, args) => {
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
      args.waistCm && args.heightCm
        ? waistToHeight(args.waistCm, args.heightCm)
        : undefined;

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
      eatingStyle: args.eatingStyle,
      budgetBandTaka: args.budgetBandTaka,
      household: args.household,
      routine: args.routine,
      homeRegion: args.homeRegion,
      calibratedPlate: args.calibratedPlate,
      ricePortionLabel: args.ricePortionLabel,
      consent: args.consent,
      consentAt: args.consent ? now : undefined,
      updatedAt: now,
    };

    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_key", (q) => q.eq("key", key))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, fields);
      return { id: existing._id, safetyMode: mode, asianBmiBand: band };
    }

    const id = await ctx.db.insert("profiles", {
      ...fields,
      createdAt: now,
    });
    await ctx.db.insert("auditLogs", {
      profileKey: key,
      action: "profile.create",
      at: now,
    });
    return { id, safetyMode: mode, asianBmiBand: band };
  },
});

/** Derived energy numbers for UI (still deterministic; no LLM). */
export const energy = query({
  args: { key: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const key = args.key ?? DEFAULT_KEY;
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_key", (q) => q.eq("key", key))
      .unique();
    if (!profile) return null;

    const bmrKcal = bmr(profile);
    const tdeeKcal = tdee(bmrKcal, profile.activity);
    const mode = profile.safetyMode;

    return {
      bmrKcal: Math.round(bmrKcal),
      tdeeKcal: Math.round(tdeeKcal),
      floorKcal: Math.round(bmrKcal),
      allowsDeficit: allowsDeficit(mode),
      allowsExerciseCompensation: allowsExerciseCompensation(mode),
      safetyMode: mode,
      asianBmi: profile.asianBmi,
      asianBmiBand: profile.asianBmiBand,
    };
  },
});
