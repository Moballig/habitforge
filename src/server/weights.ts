"use server";

import { getConvexClient, api } from "./convex";
import { getProfile, getEnergy } from "./profile";
import { adaptiveTdee, smoothWeightTrend } from "../lib/engine/adaptive";

export async function addWeight(args: {
  date: string;
  weightKg: number;
  note?: string;
  key?: string;
}) {
  const key = args.key ?? "default";
  const client = getConvexClient();

  const existing = (await client.query(api.db.find, {
    table: "weighIns",
    index: "by_profile_and_date",
    field: "profileKey",
    value: key,
    field2: "date",
    value2: args.date,
  })) as any[];

  if (existing && existing.length > 0) {
    await client.mutation(api.db.patch, {
      id: existing[0]._id,
      doc: {
        weightKg: args.weightKg,
        note: args.note,
      },
    });
    return existing[0]._id;
  }

  return await client.mutation(api.db.insert, {
    table: "weighIns",
    doc: {
      profileKey: key,
      date: args.date,
      weightKg: args.weightKg,
      note: args.note,
      loggedAt: Date.now(),
    },
  });
}

export async function removeWeight(id: string, key: string = "default") {
  const client = getConvexClient();
  return await client.mutation(api.db.remove, { id });
}

export const addWeighIn = addWeight;
export const removeWeighIn = removeWeight;

export async function getWeightTrend(today: string, key: string = "default") {
  const client = getConvexClient();
  const profile = await getProfile(key);
  const energy = await getEnergy(key);

  const weighIns = (await client.query(api.db.find, {
    table: "weighIns",
    index: "by_profile_and_date",
    field: "profileKey",
    value: key,
    order: "asc",
  })) as Array<{ _id: string; date: string; weightKg: number; note?: string }>;

  const rawWeights = weighIns.map((w) => w.weightKg);
  const smoothed = smoothWeightTrend(rawWeights);

  const series = weighIns.map((w, idx) => ({
    date: w.date,
    rawWeight: w.weightKg,
    smoothedWeight: smoothed[idx] ?? w.weightKg,
    note: w.note,
  }));

  let adaptiveResult = null;
  let days = 14;
  let deltaKg = 0;

  if (energy && weighIns.length >= 2) {
    const first = weighIns[0];
    const last = weighIns[weighIns.length - 1];
    const d1 = new Date(first.date).getTime();
    const d2 = new Date(last.date).getTime();
    days = Math.max(1, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)));
    deltaKg = last.weightKg - first.weightKg;

    adaptiveResult = adaptiveTdee({
      days,
      weighIns: weighIns.length,
      weightDeltaKg: deltaKg,
      avgIntakeKcal: energy.targetKcal,
      formulaTdee: energy.tdee,
    });
  }

  return {
    weighIns,
    series,
    adaptiveTdee: adaptiveResult,
    adaptive: adaptiveResult ?? {
      estimateKcal: energy?.tdee ?? 2000,
      confidence: 0,
      status: "formula" as const,
      moreWeighInsNeeded: 7,
      noiseNote: false,
    },
    currentWeight: weighIns.length > 0 ? weighIns[weighIns.length - 1].weightKg : profile?.weightKg,
    formulaTdee: energy?.tdee ?? 2000,
    avgIntakeKcal: energy?.targetKcal ?? 2000,
    days,
    weightDeltaKg: deltaKg,
  };
}
