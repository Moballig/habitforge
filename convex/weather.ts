import { v } from "convex/values";
import {
  action,
  internalMutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import { api, internal } from "./_generated/api";

/**
 * Weather + AQI for context-aware suggestions (Wave-4 gate, FR-D-05).
 * Open-Meteo, no API key. Single cached row; refresh skips the network
 * when the cache is under 30 minutes old.
 */
const KEY = "default";
const TTL_MS = 30 * 60 * 1000;
// homeRegion is not collected yet — Dhaka coords until onboarding asks (deferred).
const LAT = 23.8103;
const LON = 90.4125;

type Row = {
  aqi: number;
  pm25: number;
  tempC: number;
  feelsC: number;
  fetchedAt: number;
};

async function readRow(ctx: QueryCtx): Promise<Row | null> {
  const row = await ctx.db
    .query("weatherState")
    .withIndex("by_key", (q) => q.eq("key", KEY))
    .unique();
  if (!row) return null;
  return {
    aqi: row.aqi,
    pm25: row.pm25,
    tempC: row.tempC,
    feelsC: row.feelsC,
    fetchedAt: row.fetchedAt,
  };
}

const weatherRow = v.union(
  v.object({
    aqi: v.number(),
    pm25: v.number(),
    tempC: v.number(),
    feelsC: v.number(),
    fetchedAt: v.number(),
  }),
  v.null(),
);

export const get = query({
  args: {},
  returns: weatherRow,
  handler: async (ctx): Promise<Row | null> => readRow(ctx),
});

export const save = internalMutation({
  args: {
    aqi: v.number(),
    pm25: v.number(),
    tempC: v.number(),
    feelsC: v.number(),
    fetchedAt: v.number(),
  },
  returns: v.null(),
  handler: async (ctx: MutationCtx, args) => {
    const existing = await ctx.db
      .query("weatherState")
      .withIndex("by_key", (q) => q.eq("key", KEY))
      .unique();
    if (existing) await ctx.db.patch(existing._id, args);
    else await ctx.db.insert("weatherState", { key: KEY, ...args });
    return null;
  },
});

export const refresh = action({
  args: {},
  returns: weatherRow,
  // Explicit return type breaks the api.weather.get self-reference cycle.
  handler: async (ctx): Promise<Row | null> => {
    const cached = await ctx.runQuery(api.weather.get, {});
    if (cached && Date.now() - cached.fetchedAt < TTL_MS) return cached;
    try {
      const [aq, wx] = await Promise.all([
        fetch(
          `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${LAT}&longitude=${LON}&current=us_aqi,pm2_5&timezone=auto`,
        ),
        fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,apparent_temperature&timezone=auto`,
        ),
      ]);
      if (!aq.ok || !wx.ok) throw new Error("weather fetch failed");
      const aqJson = (await aq.json()) as {
        current?: { us_aqi?: number; pm2_5?: number };
      };
      const wxJson = (await wx.json()) as {
        current?: { temperature_2m?: number; apparent_temperature?: number };
      };
      const aqi = aqJson.current?.us_aqi;
      const pm25 = aqJson.current?.pm2_5;
      const tempC = wxJson.current?.temperature_2m;
      const feelsC = wxJson.current?.apparent_temperature;
      if (
        typeof aqi !== "number" ||
        typeof pm25 !== "number" ||
        typeof tempC !== "number" ||
        typeof feelsC !== "number"
      ) {
        throw new Error("weather payload missing fields");
      }
      const row = { aqi, pm25, tempC, feelsC, fetchedAt: Date.now() };
      await ctx.runMutation(internal.weather.save, row);
      return row;
    } catch {
      // Source down: keep serving the last good row (or null) — no advice beats bad advice.
      return cached;
    }
  },
});
