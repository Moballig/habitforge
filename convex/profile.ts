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
    womenFriendlyPrivacy: v.optional(v.boolean()),
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
      womenFriendlyPrivacy: args.womenFriendlyPrivacy,
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

/** FR-G-06: family/caregiver members — one shared menu, per-person portions. */
export const saveFamilyMembers = mutation({
  args: {
    key: v.optional(v.string()),
    members: v.array(
      v.object({
        id: v.string(),
        name: v.string(),
        relation: v.union(
          v.literal("child"),
          v.literal("teen"),
          v.literal("adult"),
          v.literal("elder"),
        ),
        condition: v.optional(v.union(v.literal("diabetes"), v.literal("hypertension"))),
      }),
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (args.members.length > 8) throw new Error("at most 8 family members");
    for (const m of args.members) {
      if (!m.name.trim()) throw new Error("member name required");
    }
    const key = args.key ?? DEFAULT_KEY;
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_key", (q) => q.eq("key", key))
      .unique();
    if (!profile) throw new Error("Set up your profile first");
    await ctx.db.patch(profile._id, {
      familyMembers: args.members,
      updatedAt: Date.now(),
    });
    return null;
  },
});

/** FR-E-04: user controls for the recovery plan (window 3–7 d, intake share). */
export const setBudgetControls = mutation({
  args: {
    key: v.optional(v.string()),
    windowDays: v.number(),
    intakeShare: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (!(args.windowDays >= 3 && args.windowDays <= 7)) {
      throw new Error("windowDays must be between 3 and 7");
    }
    if (!(args.intakeShare >= 0.3 && args.intakeShare <= 0.9)) {
      throw new Error("intakeShare must be between 0.3 and 0.9");
    }
    const key = args.key ?? DEFAULT_KEY;
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_key", (q) => q.eq("key", key))
      .unique();
    if (!profile) throw new Error("Set up your profile first");
    await ctx.db.patch(profile._id, {
      budgetControls: {
        windowDays: Math.round(args.windowDays),
        intakeShare: args.intakeShare,
      },
      updatedAt: Date.now(),
    });
    return null;
  },
});

/** FR-D-07: Women-friendly privacy & home-only movement mode toggle. */
export const setWomenFriendlyPrivacy = mutation({
  args: {
    key: v.optional(v.string()),
    enabled: v.boolean(),
  },
  returns: v.object({ ok: v.boolean(), enabled: v.boolean() }),
  handler: async (ctx, args) => {
    const key = args.key ?? DEFAULT_KEY;
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_key", (q) => q.eq("key", key))
      .unique();
    if (!existing) throw new Error("Profile not found");
    await ctx.db.patch(existing._id, {
      womenFriendlyPrivacy: args.enabled,
      updatedAt: Date.now(),
    });
    return { ok: true, enabled: args.enabled };
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

/** Clear all user data (privacy right to erasure). */
export const clearData = mutation({
  args: { key: v.optional(v.string()) },
  returns: v.object({ ok: v.boolean() }),
  handler: async (ctx, args) => {
    const key = args.key ?? DEFAULT_KEY;
    const meals = await ctx.db
      .query("mealLogs")
      .withIndex("by_profile_and_date", (q) => q.eq("profileKey", key))
      .collect();
    for (const m of meals) {
      await ctx.db.delete(m._id);
    }
    const activities = await ctx.db
      .query("activityLogs")
      .withIndex("by_profile_and_date", (q) => q.eq("profileKey", key))
      .collect();
    for (const a of activities) {
      await ctx.db.delete(a._id);
    }
    const weights = await ctx.db
      .query("weighIns")
      .withIndex("by_profile_and_date", (q) => q.eq("profileKey", key))
      .collect();
    for (const w of weights) {
      await ctx.db.delete(w._id);
    }
    const budgets = await ctx.db
      .query("budgetState")
      .withIndex("by_profile_and_week", (q) => q.eq("profileKey", key))
      .collect();
    for (const b of budgets) {
      await ctx.db.delete(b._id);
    }
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_key", (q) => q.eq("key", key))
      .unique();
    if (profile) {
      await ctx.db.delete(profile._id);
    }
    return { ok: true };
  },
});
