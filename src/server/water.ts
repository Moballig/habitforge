"use server";

import { getConvexClient, api } from "./convex";
import { calculateWaterProgress, DEFAULT_DAILY_GLASSES } from "../lib/engine/water";

export async function getWater(date: string, key: string = "default") {
  const client = getConvexClient();
  const existing = (await client.query(api.db.find, {
    table: "waterLogs",
    index: "by_profile_and_date",
    field: "profileKey",
    value: key,
    field2: "date",
    value2: date,
  })) as any[];

  const glasses = existing && existing.length > 0 ? existing[0].glasses : 0;
  const targetGlasses = existing && existing.length > 0 && existing[0].targetGlasses
    ? existing[0].targetGlasses
    : DEFAULT_DAILY_GLASSES;

  return calculateWaterProgress(glasses, targetGlasses);
}

export async function logWater(args: {
  key?: string;
  date: string;
  delta?: number;
  deltaGlasses?: number;
  targetGlasses?: number;
}) {
  const key = args.key ?? "default";
  const delta = args.delta ?? args.deltaGlasses ?? 1;
  const client = getConvexClient();

  const existing = (await client.query(api.db.find, {
    table: "waterLogs",
    index: "by_profile_and_date",
    field: "profileKey",
    value: key,
    field2: "date",
    value2: args.date,
  })) as any[];

  const target = args.targetGlasses ?? DEFAULT_DAILY_GLASSES;

  if (existing && existing.length > 0) {
    const current = existing[0];
    const newGlasses = Math.max(0, (current.glasses || 0) + delta);
    await client.mutation(api.db.patch, {
      id: current._id,
      doc: {
        glasses: newGlasses,
        targetGlasses: target,
        updatedAt: Date.now(),
      },
    });
    return calculateWaterProgress(newGlasses, target);
  }

  const initialGlasses = Math.max(0, delta);
  await client.mutation(api.db.insert, {
    table: "waterLogs",
    doc: {
      profileKey: key,
      date: args.date,
      glasses: initialGlasses,
      targetGlasses: target,
      updatedAt: Date.now(),
    },
  });

  return calculateWaterProgress(initialGlasses, target);
}
