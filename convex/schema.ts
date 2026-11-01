import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  habits: defineTable({
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
    archived: v.boolean(),
  })
    .index("by_archived", ["archived"]),

  habitLogs: defineTable({
    habitId: v.id("habits"),
    date: v.string(), // YYYY-MM-DD
    completed: v.boolean(),
    note: v.optional(v.string()),
  })
    .index("by_habit", ["habitId"])
    .index("by_date", ["date"])
    .index("by_habit_date", ["habitId", "date"]),
});

