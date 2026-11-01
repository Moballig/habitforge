import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { FOOD_SEED } from "../src/lib/foods/seed";
import type { MutationCtx } from "./_generated/server";
import schema from "./schema";

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
const seedResult = v.object({
  inserted: v.number(),
  updated: v.number(),
  removedStale: v.number(),
  total: v.number(),
  skipped: v.boolean(),
});

async function seedFoods(ctx: MutationCtx) {
  // Starter DB is intentionally capped below 500 rows for the buildathon.
  const existing = await ctx.db.query("foods").take(1000);
  const byName = new Map(existing.map((food) => [food.nameEn, food]));
  const wantedNames = new Set(FOOD_SEED.map((food) => food.nameEn));
  let inserted = 0;
  let updated = 0;
  let removedStale = 0;
  const now = Date.now();

  for (const food of FOOD_SEED) {
    const fields = {
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
    };
    const current = byName.get(food.nameEn);
    if (current) {
      await ctx.db.patch(current._id, fields);
      updated++;
    } else {
      await ctx.db.insert("foods", fields);
      inserted++;
    }
  }

  // Reconciliation only removes rows written by a previous seed pass.
  // Admin/user rows inserted without seededAt are never touched.
  for (const food of existing) {
    if (food.seededAt !== undefined && !wantedNames.has(food.nameEn)) {
      await ctx.db.delete(food._id);
      removedStale++;
    }
  }

  return {
    inserted,
    updated,
    removedStale,
    total: existing.length + inserted - removedStale,
    skipped: inserted === 0 && removedStale === 0,
  };
}

/** Idempotent seed of the 300+ row starter food DB. */
export const seedAll = internalMutation({
  args: {},
  returns: seedResult,
  handler: seedFoods,
});

/** Public wrapper for demo/admin (no auth yet). */
export const seed = mutation({
  args: {},
  returns: seedResult,
  handler: seedFoods,
});

export const count = query({
  args: {},
  returns: v.object({
    total: v.number(),
    byTag: v.record(v.string(), v.number()),
  }),
  handler: async (ctx) => {
    const all = await ctx.db.query("foods").take(1000);
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
  returns: v.array(schema.doc("foods")),
  handler: async (ctx, args) => {
    const limit = Math.max(1, Math.min(args.limit ?? 8, 25));
    const term = args.q.trim();
    if (!term) return [];
    const isBangla = /[\u0980-\u09ff]/.test(term);
    if (isBangla) {
      return await ctx.db
        .query("foods")
        .withSearchIndex("search_name_bn", (q) => q.search("nameBn", term))
        .take(limit);
    }
    return await ctx.db
      .query("foods")
      .withSearchIndex("search_name_en", (q) => q.search("nameEn", term))
      .take(limit);
  },
});

export const getById = query({
  args: { id: v.id("foods") },
  returns: v.union(schema.doc("foods"), v.null()),
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
    fiberPer100: v.optional(v.number()),
    measures: v.array(measure),
    sourceTag,
    isCooked: v.boolean(),
    rangeLow: v.optional(v.number()),
    rangeHigh: v.optional(v.number()),
    regionTags: v.optional(v.array(v.string())),
  },
  returns: v.id("foods"),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("foods")
      .withIndex("by_name_en", (q) => q.eq("nameEn", args.nameEn))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }
    return await ctx.db.insert("foods", args);
  },
});
