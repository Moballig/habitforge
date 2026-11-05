"use server";

import { getConvexClient, api } from "./convex";
import { getRegionCoords, outdoorAdvice } from "../lib/engine/context";

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

export async function getWeather(region: string = "Dhaka") {
  const client = getConvexClient();
  const cacheKey = region.toLowerCase();

  try {
    const existing = (await client.query(api.db.find, {
      table: "weatherState",
      index: "by_key",
      field: "key",
      value: cacheKey,
    })) as any[];

    const now = Date.now();
    if (existing && existing.length > 0) {
      const cached = existing[0];
      if (now - (cached.fetchedAt || 0) < CACHE_TTL_MS) {
        return cached;
      }
    }
  } catch {
    // If cache lookup fails, proceed to fetch fresh
  }

  return await refreshWeather(region);
}

export async function refreshWeather(region: string = "Dhaka") {
  const client = getConvexClient();
  const cacheKey = region.toLowerCase();
  const coords = getRegionCoords(cacheKey);

  let tempC = 28;
  let feelsLikeC = 30;
  let usAqi = 85;

  try {
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,apparent_temperature`;
    const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${coords.lat}&longitude=${coords.lon}&current=us_aqi`;

    const [weatherRes, aqiRes] = await Promise.all([
      fetch(weatherUrl).then((r) => r.json()).catch(() => null),
      fetch(aqiUrl).then((r) => r.json()).catch(() => null),
    ]);

    if (weatherRes?.current) {
      tempC = Math.round(weatherRes.current.temperature_2m ?? tempC);
      feelsLikeC = Math.round(weatherRes.current.apparent_temperature ?? feelsLikeC);
    }
    if (aqiRes?.current) {
      usAqi = Math.round(aqiRes.current.us_aqi ?? usAqi);
    }
  } catch {
    // Fall back to sensible defaults on network/API failure
  }

  const advice = outdoorAdvice(usAqi, feelsLikeC);

  const doc = {
    key: cacheKey,
    region,
    tempC,
    feelsLikeC,
    feelsC: feelsLikeC,
    usAqi,
    aqi: usAqi,
    pm25: 25,
    indoor: advice.indoor,
    reason: advice.reason ?? undefined,
    fetchedAt: Date.now(),
  };

  try {
    const existing = (await client.query(api.db.find, {
      table: "weatherState",
      index: "by_key",
      field: "key",
      value: cacheKey,
    })) as any[];

    if (existing && existing.length > 0) {
      await client.mutation(api.db.patch, {
        id: existing[0]._id,
        doc,
      });
      return { ...existing[0], ...doc };
    }

    const id = await client.mutation(api.db.insert, {
      table: "weatherState",
      doc,
    });

    return { _id: id, ...doc };
  } catch {
    // If database cache write fails, still return the valid weather doc
    return doc;
  }
}
