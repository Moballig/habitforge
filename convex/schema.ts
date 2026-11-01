import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const sourceTag = v.union(
  v.literal("measured"),
  v.literal("fctb"),
  v.literal("borrowed"),
  v.literal("user"),
  v.literal("estimated"),
  v.literal("estimated-recipe"),
  v.literal("ai-assisted"),
);

const safetyMode = v.union(
  v.literal("normal"),
  v.literal("restricted"),
  v.literal("doctor-first"),
);

const measure = v.object({
  label: v.string(),
  grams: v.number(),
});

export default defineSchema({
  // ─── Profile & safety (W1) ─────────────────────────────
  profiles: defineTable({
    // Demo/no-auth: single profile key for now ("default"); auth later
    key: v.string(),
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
    // Engine-derived — never set by LLM
    safetyMode,
    safetyScreen: v.optional(
      v.object({
        under18: v.boolean(),
        pregnancy: v.boolean(),
        lowBmi: v.boolean(),
        insulinOrSulfonylurea: v.boolean(),
        heartOrKidneyDisease: v.boolean(),
        eatingDisorderHistory: v.boolean(),
      }),
    ),
    asianBmi: v.optional(v.number()),
    asianBmiBand: v.optional(
      v.union(
        v.literal("under"),
        v.literal("healthy"),
        v.literal("overweight"),
        v.literal("obese"),
      ),
    ),
    waistCm: v.optional(v.number()),
    waistToHeight: v.optional(v.number()),
    eatingStyle: v.array(v.string()),
    budgetBandTaka: v.optional(v.number()),
    household: v.optional(
      v.object({
        cooks: v.optional(v.string()),
        eatersFromPot: v.optional(v.number()),
        mealsOutPerWeek: v.optional(v.number()),
      }),
    ),
    routine: v.optional(
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
    ),
    homeRegion: v.optional(v.string()),
    calibratedPlate: v.optional(v.string()),
    ricePortionLabel: v.optional(v.string()),
    consent: v.boolean(),
    consentAt: v.optional(v.number()),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  }).index("by_key", ["key"]),

  // ─── Foods (W1–2) ──────────────────────────────────────
  foods: defineTable({
    nameBn: v.string(),
    nameEn: v.string(),
    aliases: v.array(v.string()),
    kcalPer100: v.number(),
    proteinPer100: v.number(),
    carbPer100: v.number(),
    fatPer100: v.number(),
    fiberPer100: v.optional(v.number()),
    measures: v.array(measure),
    sourceTag,
    isCooked: v.boolean(),
    rangeLow: v.optional(v.number()),
    rangeHigh: v.optional(v.number()),
    regionTags: v.optional(v.array(v.string())),
    seededAt: v.optional(v.number()),
  })
    .index("by_name_en", ["nameEn"])
    .index("by_source", ["sourceTag"]),

  // ─── Meal logging (W2 skeleton now) ────────────────────
  mealLogs: defineTable({
    profileKey: v.string(),
    date: v.string(), // YYYY-MM-DD
    slot: v.union(
      v.literal("breakfast"),
      v.literal("lunch"),
      v.literal("snacks"),
      v.literal("dinner"),
    ),
    items: v.array(
      v.object({
        foodId: v.optional(v.id("foods")),
        nameBn: v.string(),
        nameEn: v.string(),
        quantity: v.number(),
        unit: v.string(),
        grams: v.number(),
        kcalLow: v.number(),
        kcalHigh: v.number(),
        sourceTag,
      }),
    ),
    method: v.union(
      v.literal("text"),
      v.literal("photo"),
      v.literal("preset"),
      v.literal("voice"),
    ),
    time: v.string(),
  })
    .index("by_profile_and_date", ["profileKey", "date"])
    .index("by_date", ["date"]),

  // ─── Activity (W4) ─────────────────────────────────────
  activityLogs: defineTable({
    profileKey: v.string(),
    date: v.string(),
    type: v.string(),
    minutes: v.number(),
    met: v.number(),
    netKcalLow: v.number(),
    netKcalHigh: v.number(),
    source: v.union(v.literal("manual"), v.literal("steps"), v.literal("preset")),
  }).index("by_profile_and_date", ["profileKey", "date"]),

  // ─── Budget state (W3) ─────────────────────────────────
  budgetState: defineTable({
    profileKey: v.string(),
    weekStart: v.string(),
    weeklyBudget: v.number(),
    weeklyUsed: v.number(),
    overshootKcal: v.number(),
    toleranceKcal: v.number(),
    windowDays: v.number(),
    intakeShare: v.number(),
    activityCapNet: v.number(),
    floorKcal: v.number(),
    safetyMode,
    plan: v.array(
      v.object({
        date: v.string(),
        trimKcal: v.number(),
        activityMin: v.number(),
        activityKcal: v.number(),
        floorNote: v.optional(v.string()),
      }),
    ),
    updatedAt: v.optional(v.number()),
  }).index("by_profile_and_week", ["profileKey", "weekStart"]),

  // ─── Weigh-ins (W3 adaptive TDEE) ──────────────────────
  weighIns: defineTable({
    profileKey: v.string(),
    date: v.string(),
    weightKg: v.number(),
  }).index("by_profile_and_date", ["profileKey", "date"]),

  // ─── Privacy / audit (W1) ──────────────────────────────
  auditLogs: defineTable({
    profileKey: v.string(),
    action: v.string(),
    at: v.number(),
    detail: v.optional(v.string()),
  }).index("by_profile", ["profileKey"]),

  // ─── Legacy HabitForge (removed from UI W1; drop after cutover) ──
  // Intentionally omitted: habits, habitLogs — delete from Convex dashboard
  // once no clients read them, or keep one deploy cycle for rollback.
});
