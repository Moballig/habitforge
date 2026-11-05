import { v } from "convex/values";
import {
  action,
  internalMutation,
  query,
  type MutationCtx,
} from "./_generated/server";
import { api, internal } from "./_generated/api";
import { getRegionCoords } from "../src/lib/engine/context";

/**
 * Weather + AQI for context-aware suggestions (Wave-4 gate, FR-D-05, FR-G-02).
 * Open-Meteo, no API key. Caches per Bangladesh division (30 min TTL).
 */
const KEY_DEFAULT = "default";
const TTL_MS = 30 * 60 * 1000;

type Row = {
  aqi: number;
  pm25: number;
  tempC: number;
  feelsC: number;
  fetchedAt: number;
  region?: string;
  regionNameEn?: string;
  regionNameBn?: string;
};

const weatherRow = v.union(
  v.object({
    aqi: v.number(),
    pm25: v.number(),
    tempC: v.number(),
    feelsC: v.number(),
    fetchedAt: v.number(),
    region: v.optional(v.string()),
    regionNameEn: v.optional(v.string()),
    regionNameBn: v.optional(v.string()),
  }),
  v.null(),
);

export const get = query({
  args: {
    region: v.optional(v.string()),
  },
  returns: weatherRow,
  handler: async (ctx, args): Promise<Row | null> => {
    let reg = args.region;
    if (!reg) {
      const profile = await ctx.db
        .query("profiles")
        .withIndex("by_key", (q) => q.eq("key", KEY_DEFAULT))
        .unique();
      reg = profile?.homeRegion ?? "dhaka";
    }
    const coords = getRegionCoords(reg);
    const cacheKey = `region:${coords.id}`;

    // Try region-specific cache first
    let row = await ctx.db
      .query("weatherState")
      .withIndex("by_key", (q) => q.eq("key", cacheKey))
      .unique();

    // Fall back to default key
    if (!row) {
      row = await ctx.db
        .query("weatherState")
        .withIndex("by_key", (q) => q.eq("key", KEY_DEFAULT))
        .unique();
    }

    if (!row) return null;
    return {
      aqi: row.aqi,
      pm25: row.pm25,
      tempC: row.tempC,
      feelsC: row.feelsC,
      fetchedAt: row.fetchedAt,
      region: coords.id,
      regionNameEn: coords.nameEn,
      regionNameBn: coords.nameBn,
    };
  },
});

export const save = internalMutation({
  args: {
    key: v.string(),
    aqi: v.number(),
    pm25: v.number(),
    tempC: v.number(),
    feelsC: v.number(),
    fetchedAt: v.number(),
    region: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx: MutationCtx, args) => {
    const existing = await ctx.db
      .query("weatherState")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();
    if (existing) await ctx.db.patch(existing._id, args);
    else await ctx.db.insert("weatherState", args);
    return null;
  },
});

export const refresh = action({
  args: {
    region: v.optional(v.string()),
  },
  returns: weatherRow,
  handler: async (ctx, args): Promise<Row | null> => {
    const cached = await ctx.runQuery(api.weather.get, { region: args.region });
    if (cached && Date.now() - cached.fetchedAt < TTL_MS) return cached;

    const coords = getRegionCoords(args.region ?? cached?.region ?? "dhaka");
    const lat = coords.lat;
    const lon = coords.lon;
    const cacheKey = `region:${coords.id}`;

    try {
      const [aq, wx] = await Promise.all([
        fetch(
          `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,pm2_5&timezone=auto`,
        ),
        fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature&timezone=auto`,
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
      const row = {
        key: cacheKey,
        aqi,
        pm25,
        tempC,
        feelsC,
        fetchedAt: Date.now(),
        region: coords.id,
      };
      await ctx.runMutation(internal.weather.save, row);
      return {
        aqi,
        pm25,
        tempC,
        feelsC,
        fetchedAt: row.fetchedAt,
        region: coords.id,
        regionNameEn: coords.nameEn,
        regionNameBn: coords.nameBn,
      };
    } catch {
      return cached;
    }
  },
});
