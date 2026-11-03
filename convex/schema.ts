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

export const ragSourceTag = v.union(
  v.literal("guideline"),
  v.literal("food-table"),
  v.literal("recipe"),
  v.literal("research"),
  v.literal("indigenous"),
  v.literal("price"),
  v.literal("faostat"),
  v.literal("market"),
);

export const ragLang = v.union(v.literal("en"), v.literal("bn"), v.literal("mixed"));

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
    // FR-G-06 family/caregiver mode: one shared menu, per-person portions
    familyMembers: v.optional(
      v.array(
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
    ),
    // FR-E-04 user controls for the recovery plan (window 3–7 d, intake share)
    budgetControls: v.optional(
      v.object({ windowDays: v.number(), intakeShare: v.number() }),
    ),
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
    .index("by_source", ["sourceTag"])
    .searchIndex("search_name_en", { searchField: "nameEn" })
    .searchIndex("search_name_bn", { searchField: "nameBn" }),

  // ─── RAG knowledge base (Wave 5 corpus) ────────────────
  ragChunks: defineTable({
    docId: v.string(),
    chunkIndex: v.number(),
    sourceTag: ragSourceTag,
    source: v.string(),
    section: v.optional(v.string()),
    page: v.optional(v.number()),
    lang: ragLang,
    text: v.string(),
    keywords: v.array(v.string()),
    embedding: v.array(v.float64()),
    url: v.optional(v.string()),
    publishedAt: v.optional(v.string()),
  })
    .index("by_doc", ["docId"])
    .index("by_doc_chunk", ["docId", "chunkIndex"])
    .index("by_source_tag", ["sourceTag"])
    .searchIndex("search_text", {
      searchField: "text",
      filterFields: ["sourceTag", "lang"],
    })
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: 384,
      filterFields: ["sourceTag", "lang"],
    }),

  // ─── Structured datasets from /data ────────────────────
  foodFacts: defineTable({
    key: v.string(),
    nameEn: v.string(),
    nameBn: v.string(),
    scientificName: v.optional(v.string()),
    category: v.string(),
    kcalPer100: v.number(),
    proteinPer100: v.number(),
    fatPer100: v.number(),
    carbPer100: v.number(),
    fiberPer100: v.optional(v.number()),
    calciumMg: v.optional(v.number()),
    ironMg: v.optional(v.number()),
    sodiumMg: v.optional(v.number()),
    zincMg: v.optional(v.number()),
    vitaminAMcg: v.optional(v.number()),
    vitaminCMg: v.optional(v.number()),
    sourceTag: v.union(
      v.literal("fctb"),
      v.literal("regional-table"),
      v.literal("indigenous"),
    ),
    sourceDetail: v.string(),
    regionTags: v.optional(v.array(v.string())),
  })
    .index("by_key", ["key"])
    .index("by_category", ["category"])
    .searchIndex("search_name_en", { searchField: "nameEn" })
    .searchIndex("search_name_bn", { searchField: "nameBn" }),

  recipes: defineTable({
    key: v.string(),
    name: v.string(),
    cuisine: v.string(),
    minutes: v.optional(v.number()),
    ingredients: v.array(v.string()),
    instructions: v.string(),
    url: v.optional(v.string()),
    source: v.string(),
    region: v.optional(v.string()),
  })
    .index("by_key", ["key"])
    .index("by_cuisine", ["cuisine"])
    .searchIndex("search_name", {
      searchField: "name",
      filterFields: ["cuisine"],
    }),

  priceObservations: defineTable({
    key: v.string(),
    date: v.string(),
    commodity: v.string(),
    unit: v.string(),
    priceBDT: v.number(),
    usdPrice: v.optional(v.number()),
    priceType: v.optional(v.string()),
    market: v.optional(v.string()),
    admin1: v.optional(v.string()),
    category: v.optional(v.string()),
    source: v.string(),
  })
    .index("by_key", ["key"])
    .index("by_commodity_and_date", ["commodity", "date"])
    .index("by_date", ["date"])
    .searchIndex("search_commodity", { searchField: "commodity" }),

  markets: defineTable({
    marketId: v.string(),
    name: v.string(),
    admin1: v.string(),
    admin2: v.string(),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    country: v.string(),
  }).index("by_market_id", ["marketId"]),

  nutritionIndicators: defineTable({
    key: v.string(),
    dataset: v.union(
      v.literal("food-balance"),
      v.literal("food-security"),
      v.literal("affordability"),
    ),
    item: v.string(),
    element: v.string(),
    unit: v.string(),
    year: v.string(),
    value: v.number(),
    flag: v.optional(v.string()),
    source: v.string(),
  })
    .index("by_key", ["key"])
    .index("by_dataset_and_item", ["dataset", "item"])
    .searchIndex("search_item", {
      searchField: "item",
      filterFields: ["dataset"],
    }),

  datasetSources: defineTable({
    key: v.string(),
    name: v.string(),
    sourceTag: ragSourceTag,
    license: v.optional(v.string()),
    url: v.optional(v.string()),
    recordCount: v.number(),
    chunkCount: v.number(),
    ingestedAt: v.number(),
    notes: v.optional(v.string()),
  }).index("by_key", ["key"]),

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

  // ─── Weather / AQI cache (W4) ─────────────────────────
  weatherState: defineTable({
    key: v.string(),
    aqi: v.number(),
    pm25: v.number(),
    tempC: v.number(),
    feelsC: v.number(),
    fetchedAt: v.number(),
  }).index("by_key", ["key"]),

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
