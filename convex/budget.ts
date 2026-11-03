import { v } from "convex/values";
import { query } from "./_generated/server";
import { bmr, gentleDeficitKcal, rebalance, tdee } from "../src/lib/engine";

const DEFAULT_KEY = "default";
const TOLERANCE_KCAL = 100;

const safetyMode = v.union(
  v.literal("normal"),
  v.literal("restricted"),
  v.literal("doctor-first"),
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
  const dow = start.getUTCDay(); // 0=Sun
  const monday = addDays(start, -((dow + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => toISODate(addDays(monday, i)));
}

export const get = query({
  args: { key: v.optional(v.string()), today: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      weekStart: v.string(),
      weekEnd: v.string(),
      weeklyBudget: v.number(),
      weeklyUsed: v.number(),
      overshootKcal: v.number(),
      toleranceKcal: v.number(),
      windowDays: v.number(),
      intakeShare: v.number(),
      activityCapNet: v.number(),
      floorKcal: v.number(),
      dailyTargetKcal: v.number(),
      safetyMode,
      blocked: v.boolean(),
      loggedDays: v.number(),
      plan: v.array(
        v.object({
          date: v.string(),
          trimKcal: v.number(),
          activityMin: v.number(),
          activityKcal: v.number(),
          floorNote: v.optional(v.string()),
        }),
      ),
      series: v.array(
        v.object({ date: v.string(), kcal: v.number(), target: v.number() }),
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

    const dates = weekDates(args.today);
    const series: Array<{ date: string; kcal: number; target: number }> = [];
    let weeklyUsed = 0;
    let loggedDays = 0;

    for (const date of dates) {
      const meals = await ctx.db
        .query("mealLogs")
        .withIndex("by_profile_and_date", (q) =>
          q.eq("profileKey", key).eq("date", date),
        )
        .take(100);
      let dayKcal = 0;
      for (const meal of meals) {
        for (const item of meal.items) {
          dayKcal += (item.kcalLow + item.kcalHigh) / 2;
        }
      }
      if (meals.length > 0) loggedDays += 1;
      weeklyUsed += dayKcal;
      series.push({ date, kcal: Math.round(dayKcal), target: 0 }); // target filled below
    }

    const bmrKcal = Math.round(bmr(profile));
    const tdeeKcal = Math.round(tdee(bmrKcal, profile.activity));
    const deficit =
      profile.goal === "gentle-change" ? gentleDeficitKcal() : 0;
    const dailyTargetKcal = Math.max(tdeeKcal - deficit, bmrKcal);
    const floorKcal = bmrKcal;
    const weeklyBudget = dailyTargetKcal * 7;

    for (const point of series) point.target = dailyTargetKcal;

    // Weekly excess fed to the day-shaped engine as a single representative
    // overshoot day; floor/cap clamps then run on real daily numbers.
    const excess = Math.max(0, Math.round(weeklyUsed) - weeklyBudget);
    const futureDates = Array.from({ length: 7 }, (_, i) =>
      toISODate(addDays(parseISODate(args.today), i + 1)),
    );

    const result = rebalance(
      {
        intakeKcal: dailyTargetKcal + excess,
        targetKcal: dailyTargetKcal,
        floorKcal,
        weightKg: profile.weightKg,
        dates: futureDates,
        safetyMode: profile.safetyMode,
      },
      { floorKcal, toleranceKcal: TOLERANCE_KCAL },
    );

    return {
      weekStart: dates[0],
      weekEnd: dates[6],
      weeklyBudget,
      weeklyUsed: Math.round(weeklyUsed),
      overshootKcal: result.overshootKcal,
      toleranceKcal: TOLERANCE_KCAL,
      windowDays: result.windowDays,
      intakeShare: result.intakeShare,
      activityCapNet: result.activityCapNet,
      floorKcal,
      dailyTargetKcal,
      safetyMode: profile.safetyMode,
      blocked: result.blocked,
      loggedDays,
      plan: result.plan.map((d) => ({
        date: d.date,
        trimKcal: d.trimKcal,
        activityMin: d.activityMin,
        activityKcal: d.activityKcal,
        ...(d.floorClamped ? { floorNote: "floor" } : {}),
      })),
      series,
    };
  },
});
