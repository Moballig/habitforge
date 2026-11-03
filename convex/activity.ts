import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { ACTIVITY_METS, netKcalRange, stepsToMinutes } from "../src/lib/engine/mets";

const DEFAULT_KEY = "default";

const source = v.union(
  v.literal("manual"),
  v.literal("steps"),
  v.literal("preset"),
);

function parseISODate(date: string): Date {
  return new Date(`${date}T12:00:00Z`);
}

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, n: number): Date {
  const out = new Date(d);
  out.setUTCDate(out.getUTCDate() + n);
  return out;
}

/** Monday-based week containing `today` (client-local YYYY-MM-DD). */
function weekDates(today: string): string[] {
  const start = parseISODate(today);
  const dow = start.getUTCDay();
  const monday = addDays(start, -((dow + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => toISODate(addDays(monday, i)));
}

export const create = mutation({
  args: {
    key: v.optional(v.string()),
    date: v.string(),
    type: v.string(),
    minutes: v.number(),
    source,
  },
  returns: v.id("activityLogs"),
  handler: async (ctx, args) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(args.date)) {
      throw new Error("date must use YYYY-MM-DD");
    }
    const met = ACTIVITY_METS[args.type];
    if (met === undefined) {
      throw new Error(`Unknown activity type: ${args.type}`);
    }
    if (args.source === "steps") {
      if (!(args.minutes >= 1 && args.minutes <= 100_000)) {
        throw new Error("steps must be between 1 and 100000");
      }
    } else if (!(args.minutes >= 1 && args.minutes <= 600)) {
      throw new Error("minutes must be between 1 and 600");
    }
    const key = args.key ?? DEFAULT_KEY;
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_key", (q) => q.eq("key", key))
      .unique();
    if (!profile) throw new Error("Set up your profile first");
    const minutes =
      args.source === "steps" ? stepsToMinutes(args.minutes) : args.minutes;
    if (!(minutes >= 1 && minutes <= 600)) {
      throw new Error("minutes must be between 1 and 600");
    }
    const { low, high } = netKcalRange(met, profile.weightKg, minutes);
    return await ctx.db.insert("activityLogs", {
      profileKey: key,
      date: args.date,
      type: args.type,
      minutes,
      met,
      netKcalLow: low,
      netKcalHigh: high,
      source: args.source,
    });
  },
});

export const remove = mutation({
  args: { key: v.optional(v.string()), id: v.id("activityLogs") },
  returns: v.object({ ok: v.boolean() }),
  handler: async (ctx, args) => {
    const key = args.key ?? DEFAULT_KEY;
    const existing = await ctx.db.get(args.id);
    if (!existing || existing.profileKey !== key) {
      throw new Error("Activity log not found");
    }
    await ctx.db.delete(existing._id);
    return { ok: true };
  },
});

/** Week of activity for the /activity gauge (FR-D-01/02). */
export const listWeek = query({
  args: { key: v.optional(v.string()), today: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      weekMinutes: v.number(),
      weekNetKcalLow: v.number(),
      weekNetKcalHigh: v.number(),
      activeDays: v.number(),
      entries: v.array(
        v.object({
          _id: v.id("activityLogs"),
          date: v.string(),
          type: v.string(),
          minutes: v.number(),
          netKcalLow: v.number(),
          netKcalHigh: v.number(),
          source,
        }),
      ),
    }),
  ),
  handler: async (ctx, args) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(args.today)) {
      throw new Error("today must use YYYY-MM-DD");
    }
    const key = args.key ?? DEFAULT_KEY;
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_key", (q) => q.eq("key", key))
      .unique();
    if (!profile) return null;

    const entries: Array<{
      _id: Id<"activityLogs">;
      date: string;
      type: string;
      minutes: number;
      netKcalLow: number;
      netKcalHigh: number;
      source: "manual" | "steps" | "preset";
    }> = [];
    let weekMinutes = 0;
    let weekNetKcalLow = 0;
    let weekNetKcalHigh = 0;
    const activeDates = new Set<string>();

    for (const date of weekDates(args.today)) {
      const rows = await ctx.db
        .query("activityLogs")
        .withIndex("by_profile_and_date", (q) =>
          q.eq("profileKey", key).eq("date", date),
        )
        .take(100);
      for (const row of rows) {
        entries.push({
          _id: row._id,
          date: row.date,
          type: row.type,
          minutes: row.minutes,
          netKcalLow: row.netKcalLow,
          netKcalHigh: row.netKcalHigh,
          source: row.source,
        });
        weekMinutes += row.minutes;
        weekNetKcalLow += row.netKcalLow;
        weekNetKcalHigh += row.netKcalHigh;
        activeDates.add(row.date);
      }
    }

    return {
      weekMinutes,
      weekNetKcalLow,
      weekNetKcalHigh,
      activeDays: activeDates.size,
      entries,
    };
  },
});
