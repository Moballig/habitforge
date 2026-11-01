import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import schema from "./schema";

const DEFAULT_KEY = "default";

const sourceTag = v.union(
  v.literal("measured"),
  v.literal("fctb"),
  v.literal("borrowed"),
  v.literal("user"),
  v.literal("estimated"),
  v.literal("estimated-recipe"),
  v.literal("ai-assisted"),
);

const mealItem = v.object({
  foodId: v.optional(v.id("foods")),
  nameBn: v.string(),
  nameEn: v.string(),
  quantity: v.number(),
  unit: v.string(),
  grams: v.number(),
  kcalLow: v.number(),
  kcalHigh: v.number(),
  sourceTag,
});

const slot = v.union(
  v.literal("breakfast"),
  v.literal("lunch"),
  v.literal("snacks"),
  v.literal("dinner"),
);

const method = v.union(
  v.literal("text"),
  v.literal("photo"),
  v.literal("preset"),
  v.literal("voice"),
);

function requireDate(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error("date must use YYYY-MM-DD");
  }
}

function requireItems(items: Array<{
  quantity: number;
  grams: number;
  kcalLow: number;
  kcalHigh: number;
}>) {
  if (items.length === 0) throw new Error("A meal needs at least one item");
  for (const item of items) {
    if (item.quantity <= 0 || item.grams <= 0) {
      throw new Error("Meal quantities and grams must be positive");
    }
    if (item.kcalLow < 0 || item.kcalHigh < item.kcalLow) {
      throw new Error("Invalid calorie range");
    }
  }
}

/** List all meals for a profile on a date. */
export const listByDate = query({
  args: { key: v.optional(v.string()), date: v.string() },
  returns: v.array(schema.doc("mealLogs")),
  handler: async (ctx, args) => {
    requireDate(args.date);
    const key = args.key ?? DEFAULT_KEY;
    return await ctx.db
      .query("mealLogs")
      .withIndex("by_profile_and_date", (q) =>
        q.eq("profileKey", key).eq("date", args.date),
      )
      .order("asc")
      .take(100);
  },
});

/** List recent meals (last N dates with entries). */
export const listRecent = query({
  args: { key: v.optional(v.string()), limit: v.optional(v.number()) },
  returns: v.array(schema.doc("mealLogs")),
  handler: async (ctx, args) => {
    const key = args.key ?? DEFAULT_KEY;
    const limit = Math.max(1, Math.min(args.limit ?? 10, 50));
    return await ctx.db
      .query("mealLogs")
      .withIndex("by_profile_and_date", (q) => q.eq("profileKey", key))
      .order("desc")
      .take(limit);
  },
});

/** Create a meal log. All kcal values computed by client/code, never LLM. */
export const create = mutation({
  args: {
    key: v.optional(v.string()),
    date: v.string(),
    slot,
    items: v.array(mealItem),
    method,
    time: v.optional(v.string()),
  },
  returns: v.id("mealLogs"),
  handler: async (ctx, args) => {
    requireDate(args.date);
    requireItems(args.items);
    const key = args.key ?? DEFAULT_KEY;
    const now = Date.now();
    return await ctx.db.insert("mealLogs", {
      profileKey: key,
      date: args.date,
      slot: args.slot,
      items: args.items,
      method: args.method,
      time: args.time ?? new Date(now).toISOString().slice(11, 16),
    });
  },
});

/** Update a meal log (always editable). */
export const update = mutation({
  args: {
    key: v.optional(v.string()),
    id: v.id("mealLogs"),
    items: v.optional(v.array(mealItem)),
    slot: v.optional(slot),
    date: v.optional(v.string()),
  },
  returns: v.object({ ok: v.boolean() }),
  handler: async (ctx, args) => {
    const key = args.key ?? DEFAULT_KEY;
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Meal log not found");
    if (existing.profileKey !== key) throw new Error("Meal log not found");
    if (args.items) requireItems(args.items);
    if (args.date) requireDate(args.date);
    const patch: Partial<Pick<Doc<"mealLogs">, "items" | "slot" | "date">> = {};
    if (args.items) patch.items = args.items;
    if (args.slot) patch.slot = args.slot;
    if (args.date) patch.date = args.date;
    await ctx.db.patch(args.id, patch);
    return { ok: true };
  },
});

/** Remove a meal log. */
export const remove = mutation({
  args: { key: v.optional(v.string()), id: v.id("mealLogs") },
  returns: v.object({ ok: v.boolean() }),
  handler: async (ctx, args) => {
    const key = args.key ?? DEFAULT_KEY;
    const existing = await ctx.db.get(args.id);
    if (!existing || existing.profileKey !== key) {
      throw new Error("Meal log not found");
    }
    await ctx.db.delete(args.id);
    return { ok: true };
  },
});

/** "Same as yesterday" — copy a meal from a source date to a target date. */
export const copyMeal = mutation({
  args: {
    key: v.optional(v.string()),
    sourceId: v.id("mealLogs"),
    targetDate: v.string(),
    targetSlot: v.optional(slot),
  },
  returns: v.id("mealLogs"),
  handler: async (ctx, args) => {
    const key = args.key ?? DEFAULT_KEY;
    requireDate(args.targetDate);
    const source = await ctx.db.get(args.sourceId);
    if (!source || source.profileKey !== key) {
      throw new Error("Source meal not found");
    }
    return await ctx.db.insert("mealLogs", {
      profileKey: key,
      date: args.targetDate,
      slot: args.targetSlot ?? source.slot,
      items: source.items,
      method: source.method,
      time: source.time,
    });
  },
});

/** Day summary: totals across all slots for a date. */
export const daySummary = query({
  args: { key: v.optional(v.string()), date: v.string() },
  returns: v.object({
    date: v.string(),
    mealCount: v.number(),
    kcalLow: v.number(),
    kcalHigh: v.number(),
    bySlot: v.object({
      breakfast: v.number(),
      lunch: v.number(),
      snacks: v.number(),
      dinner: v.number(),
    }),
  }),
  handler: async (ctx, args) => {
    requireDate(args.date);
    const key = args.key ?? DEFAULT_KEY;
    const meals = await ctx.db
      .query("mealLogs")
      .withIndex("by_profile_and_date", (q) =>
        q.eq("profileKey", key).eq("date", args.date),
      )
      .take(100);

    let kcalLow = 0;
    let kcalHigh = 0;
    const bySlot = {
      breakfast: 0,
      lunch: 0,
      snacks: 0,
      dinner: 0,
    };

    for (const meal of meals) {
      for (const item of meal.items) {
        kcalLow += item.kcalLow;
        kcalHigh += item.kcalHigh;
        bySlot[meal.slot] += item.kcalLow;
      }
    }

    return {
      date: args.date,
      mealCount: meals.length,
      kcalLow: Math.round(kcalLow),
      kcalHigh: Math.round(kcalHigh),
      bySlot,
    };
  },
});
