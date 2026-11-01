import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ─── Queries ──────────────────────────────────────────────

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("habitLogs").collect();
  },
});

export const listByHabit = query({
  args: { habitId: v.id("habits") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("habitLogs")
      .withIndex("by_habit", (q) => q.eq("habitId", args.habitId))
      .collect();
  },
});

export const listByDate = query({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("habitLogs")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .collect();
  },
});

export const getByHabitAndDate = query({
  args: {
    habitId: v.id("habits"),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("habitLogs")
      .withIndex("by_habit_date", (q) =>
        q.eq("habitId", args.habitId).eq("date", args.date)
      )
      .first();
  },
});

// ─── Mutations ────────────────────────────────────────────

export const toggle = mutation({
  args: {
    habitId: v.id("habits"),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if a log already exists for this habit+date
    const existing = await ctx.db
      .query("habitLogs")
      .withIndex("by_habit_date", (q) =>
        q.eq("habitId", args.habitId).eq("date", args.date)
      )
      .first();

    if (existing) {
      // Toggle off — delete the log
      await ctx.db.delete(existing._id);
      return false;
    } else {
      // Toggle on — create the log
      await ctx.db.insert("habitLogs", {
        habitId: args.habitId,
        date: args.date,
        completed: true,
      });
      return true;
    }
  },
});

export const addNote = mutation({
  args: {
    habitId: v.id("habits"),
    date: v.string(),
    note: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("habitLogs")
      .withIndex("by_habit_date", (q) =>
        q.eq("habitId", args.habitId).eq("date", args.date)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { note: args.note });
    }
  },
});

