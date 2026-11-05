import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { GLASS_ML, DEFAULT_DAILY_GLASSES } from "../src/lib/engine/water";

const DEFAULT_KEY = "default";

export const get = query({
  args: {
    key: v.optional(v.string()),
    date: v.string(),
  },
  returns: v.object({
    glasses: v.number(),
    targetGlasses: v.number(),
    ml: v.number(),
    targetMl: v.number(),
  }),
  handler: async (ctx, args) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(args.date)) {
      throw new Error("date must use YYYY-MM-DD");
    }
    const key = args.key ?? DEFAULT_KEY;
    const log = await ctx.db
      .query("waterLogs")
      .withIndex("by_profile_and_date", (q) =>
        q.eq("profileKey", key).eq("date", args.date),
      )
      .unique();

    const glasses = log?.glasses ?? 0;
    const targetGlasses = log?.targetGlasses ?? DEFAULT_DAILY_GLASSES;

    return {
      glasses,
      targetGlasses,
      ml: glasses * GLASS_ML,
      targetMl: targetGlasses * GLASS_ML,
    };
  },
});

export const log = mutation({
  args: {
    key: v.optional(v.string()),
    date: v.string(),
    delta: v.number(),
  },
  returns: v.object({
    glasses: v.number(),
    targetGlasses: v.number(),
    ml: v.number(),
  }),
  handler: async (ctx, args) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(args.date)) {
      throw new Error("date must use YYYY-MM-DD");
    }
    const key = args.key ?? DEFAULT_KEY;
    const existing = await ctx.db
      .query("waterLogs")
      .withIndex("by_profile_and_date", (q) =>
        q.eq("profileKey", key).eq("date", args.date),
      )
      .unique();

    const currentGlasses = existing?.glasses ?? 0;
    const newGlasses = Math.max(0, Math.min(40, currentGlasses + args.delta));
    const targetGlasses = existing?.targetGlasses ?? DEFAULT_DAILY_GLASSES;

    if (existing) {
      await ctx.db.patch(existing._id, { glasses: newGlasses });
    } else {
      await ctx.db.insert("waterLogs", {
        profileKey: key,
        date: args.date,
        glasses: newGlasses,
        targetGlasses,
      });
    }

    return {
      glasses: newGlasses,
      targetGlasses,
      ml: newGlasses * GLASS_ML,
    };
  },
});

