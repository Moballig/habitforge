import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ─── Queries ──────────────────────────────────────────────

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("habits")
      .withIndex("by_archived", (q) => q.eq("archived", false))
      .collect();
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("habits").collect();
  },
});

export const get = query({
  args: { id: v.id("habits") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// ─── Mutations ────────────────────────────────────────────

export const create = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    category: v.union(
      v.literal("health"),
      v.literal("fitness"),
      v.literal("mindfulness"),
      v.literal("productivity"),
      v.literal("learning"),
      v.literal("social"),
      v.literal("creativity"),
      v.literal("other")
    ),
    color: v.string(),
    frequency: v.union(
      v.literal("daily"),
      v.literal("weekdays"),
      v.literal("weekends"),
      v.literal("custom")
    ),
    customDays: v.optional(v.array(v.number())),
  },
  handler: async (ctx, args) => {
    const habitId = await ctx.db.insert("habits", {
      ...args,
      archived: false,
    });
    return habitId;
  },
});

export const update = mutation({
  args: {
    id: v.id("habits"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(
      v.union(
        v.literal("health"),
        v.literal("fitness"),
        v.literal("mindfulness"),
        v.literal("productivity"),
        v.literal("learning"),
        v.literal("social"),
        v.literal("creativity"),
        v.literal("other")
      )
    ),
    color: v.optional(v.string()),
    frequency: v.optional(
      v.union(
        v.literal("daily"),
        v.literal("weekdays"),
        v.literal("weekends"),
        v.literal("custom")
      )
    ),
    customDays: v.optional(v.array(v.number())),
    archived: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("habits") },
  handler: async (ctx, args) => {
    // Delete all associated logs first
    const logs = await ctx.db
      .query("habitLogs")
      .withIndex("by_habit", (q) => q.eq("habitId", args.id))
      .collect();

    for (const log of logs) {
      await ctx.db.delete(log._id);
    }

    // Delete the habit
    await ctx.db.delete(args.id);
  },
});

export const archive = mutation({
  args: { id: v.id("habits") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { archived: true });
  },
});

