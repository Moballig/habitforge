import { v } from "convex/values";
import { mutation, query, type QueryCtx } from "./_generated/server";
import { adaptiveTdee, bmr, tdee } from "../src/lib/engine";

const DEFAULT_KEY = "default";
const WINDOW_DAYS = 14; // adaptive blend settles over ~2–3 weeks (FR-ATDEE-03)

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

async function avgIntakeOver(
  ctx: QueryCtx,
  key: string,
  dates: string[],
): Promise<number> {
  let total = 0;
  for (const date of dates) {
    const meals = await ctx.db
      .query("mealLogs")
      .withIndex("by_profile_and_date", (q) =>
        q.eq("profileKey", key).eq("date", date),
      )
      .take(100);
    for (const meal of meals) {
      for (const item of meal.items) {
        total += (item.kcalLow + item.kcalHigh) / 2;
      }
    }
  }
  return dates.length > 0 ? total / dates.length : 0;
}

export const add = mutation({
  args: { key: v.optional(v.string()), date: v.string(), weightKg: v.number() },
  returns: v.id("weighIns"),
  handler: async (ctx, args) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(args.date)) {
      throw new Error("date must use YYYY-MM-DD");
    }
    if (!(args.weightKg >= 20 && args.weightKg <= 300)) {
      throw new Error("weightKg must be between 20 and 300");
    }
    const key = args.key ?? DEFAULT_KEY;
    const existing = await ctx.db
      .query("weighIns")
      .withIndex("by_profile_and_date", (q) =>
        q.eq("profileKey", key).eq("date", args.date),
      )
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { weightKg: args.weightKg });
      return existing._id;
    }
    return await ctx.db.insert("weighIns", {
      profileKey: key,
      date: args.date,
      weightKg: args.weightKg,
    });
  },
});

export const remove = mutation({
  args: { key: v.optional(v.string()), id: v.id("weighIns") },
  returns: v.object({ ok: v.boolean() }),
  handler: async (ctx, args) => {
    const key = args.key ?? DEFAULT_KEY;
    const existing = await ctx.db.get(args.id);
    if (!existing || existing.profileKey !== key) {
      throw new Error("Weigh-in not found");
    }
    await ctx.db.delete(existing._id);
    return { ok: true };
  },
});

/** Weight trend + adaptive TDEE over the last ≤14 days of weigh-ins (FR-ATDEE-*, FR-E-10). */
export const trend = query({
  args: { key: v.optional(v.string()), today: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      weighIns: v.array(v.object({ date: v.string(), weightKg: v.number() })),
      adaptive: v.object({
        estimateKcal: v.number(),
        confidence: v.number(),
        status: v.union(
          v.literal("formula"),
          v.literal("improving"),
          v.literal("settled"),
        ),
        moreWeighInsNeeded: v.number(),
        noiseNote: v.boolean(),
      }),
      formulaTdee: v.number(),
      avgIntakeKcal: v.number(),
      weightDeltaKg: v.number(),
      days: v.number(),
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

    const formulaTdee = Math.round(tdee(bmr(profile), profile.activity));

    const rows = await ctx.db
      .query("weighIns")
      .withIndex("by_profile_and_date", (q) => q.eq("profileKey", key))
      .order("desc")
      .take(30);

    // Keep only entries within WINDOW_DAYS of the latest — bounds both the
    // intake queries and the adaptive window (FR-ATDEE-02/03).
    let kept = rows;
    if (rows.length > 0 && rows[0]) {
      const cutoff = toISODate(addDays(parseISODate(rows[0].date), -(WINDOW_DAYS - 1)));
      kept = rows.filter((r) => r.date >= cutoff);
    }
    kept = [...kept].reverse(); // ascending

    let dates: string[] = [];
    let weightDeltaKg = 0;
    if (kept.length > 0) {
      const first = kept[0]!;
      const last = kept[kept.length - 1]!;
      const span =
        Math.round(
          (parseISODate(last.date).getTime() - parseISODate(first.date).getTime()) /
            86_400_000,
        ) + 1;
      dates = Array.from({ length: span }, (_, i) =>
        toISODate(addDays(parseISODate(first.date), i)),
      );
      weightDeltaKg = Math.round((last.weightKg - first.weightKg) * 100) / 100;
    } else {
      // No weigh-ins yet: still report the last 7 days so intake context exists.
      dates = Array.from({ length: 7 }, (_, i) =>
        toISODate(addDays(parseISODate(args.today), i - 6)),
      );
    }

    const avgIntakeKcal = Math.round(await avgIntakeOver(ctx, key, dates));
    const adaptive = adaptiveTdee({
      formulaTdee,
      avgIntakeKcal,
      weightDeltaKg,
      // Weight-window days: 0 until there are weigh-ins (engine clamps to 1),
      // so an empty state stays on "formula", never "improving".
      days: kept.length > 0 ? dates.length : 0,
      weighIns: kept.length,
    });

    return {
      weighIns: kept.map((r) => ({ date: r.date, weightKg: r.weightKg })),
      adaptive,
      formulaTdee,
      avgIntakeKcal,
      weightDeltaKg,
      days: dates.length,
    };
  },
});
