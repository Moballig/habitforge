import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { FOOD_SEED } from "../src/lib/foods/seed";
import type { Doc } from "./_generated/dataModel";

const sourceTag = v.union(
  v.literal("measured"),
  v.literal("fctb"),
  v.literal("borrowed"),
  v.literal("user"),
  v.literal("estimated"),
  v.literal("estimated-recipe"),
  v.literal("ai-assisted"),
);

const measure = v.object({ label: v.string(), grams: v.number() });

/** Idempotent seed of the 150-row starter food DB (W1 gate). */
export const seedAll = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("foods").collect();
    if (existing.length >= FOOD_SEED.length) {
      return { inserted: 0, total: existing.length, skipped: true };
    }
    const byName = new Set(existing.map((d) => d.nameEn));
    let inserted = 0;
    const now = Date.now();
    for (const food of FOOD_SEED) {
      if (byName.has(food.nameEn)) continue;
      await ctx.db.insert("foods", {
        nameBn: food.nameBn,
        nameEn: food.nameEn,
        aliases: food.aliases,
        kcalPer100: food.kcalPer100,
        proteinPer100: food.proteinPer100,
        carbPer100: food.carbPer100,
        fatPer100: food.fatPer100,
        fiberPer100: food.fiberPer100,
        measures: food.measures,
        sourceTag: food.sourceTag,
        isCooked: food.isCooked,
        rangeLow: food.rangeLow,
        rangeHigh: food.rangeHigh,
        regionTags: food.regionTags,
        seededAt: now,
      });
      inserted++;
    }
    return { inserted, total: existing.length + inserted, skipped: false };
  },
});

/** Public wrapper for demo/admin (no auth yet). */
export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("foods").collect();
    if (existing.length >= FOOD_SEED.length) {
      return { inserted: 0, total: existing.length, skipped: true };
    }
    const byName = new Set(existing.map((d: Doc<"foods">) => d.nameEn));
    let inserted = 0;
    const now = Date.now();
    for (const food of FOOD_SEED) {
      if (byName.has(food.nameEn)) continue;
      await ctx.db.insert("foods", {
        nameBn: food.nameBn,
        nameEn: food.nameEn,
        aliases: food.aliases,
        kcalPer100: food.kcalPer100,
        proteinPer100: food.proteinPer100,
        carbPer100: food.carbPer100,
        fatPer100: food.fatPer100,
        fiberPer100: food.fiberPer100,
        measures: food.measures,
        sourceTag: food.sourceTag,
        isCooked: food.isCooked,
        rangeLow: food.rangeLow,
        rangeHigh: food.rangeHigh,
        regionTags: food.regionTags,
        seededAt: now,
      });
      inserted++;
    }
    return { inserted, total: existing.length + inserted, skipped: false };
  },
});

export const count = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("foods").collect();
    const byTag: Record<string, number> = {};
    for (const f of all) {
      byTag[f.sourceTag] = (byTag[f.sourceTag] ?? 0) + 1;
    }
    return { total: all.length, byTag };
  },
});

/** Simple alias/name search (client also has offline seed for top-5). */
export const search = query({
  args: { q: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 8, 25);
    const q = args.q.trim().toLowerCase();
    if (!q) return [];
    const all = await ctx.db.query("foods").collect();
    const scored = all
      .map((f) => {
        let score = 0;
        if (f.nameEn.toLowerCase().includes(q)) score += 3;
        if (f.nameBn.includes(args.q.trim())) score += 3;
        if (f.aliases.some((a) => a.toLowerCase().includes(q))) score += 2;
        return { food: f, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
    return scored.map((s) => s.food);
  },
});

export const getById = query({
  args: { id: v.id("foods") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const upsert = mutation({
  args: {
    nameBn: v.string(),
    nameEn: v.string(),
    aliases: v.array(v.string()),
    kcalPer100: v.number(),
    proteinPer100: v.number(),
    carbPer100: v.number(),
    fatPer100: v.number(),
    measures: v.array(measure),
    sourceTag,
    isCooked: v.boolean(),
    rangeLow: v.optional(v.number()),
    rangeHigh: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("foods", { ...args, seededAt: now });
  },
});
