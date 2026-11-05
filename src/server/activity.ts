"use server";

import { getConvexClient, api } from "./convex";
import { ACTIVITY_METS, stepsToMinutes, netKcalRange } from "../lib/engine/mets";
import { getProfile } from "./profile";

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

function weekDates(today: string): string[] {
  const start = parseISODate(today);
  const dow = start.getUTCDay();
  const monday = addDays(start, -((dow + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => toISODate(addDays(monday, i)));
}

export async function listWeekActivity(today: string, key: string = "default") {
  const client = getConvexClient();
  const dates = weekDates(today);

  const logs = (await client.query(api.db.find, {
    table: "activityLogs",
    index: "by_profile_and_date",
    field: "profileKey",
    value: key,
  })) as any[];

  const dateSet = new Set(dates);
  const weekLogs = logs.filter((l) => dateSet.has(l.date));

  let totalMinutes = 0;
  let totalNetKcalLow = 0;
  let totalNetKcalHigh = 0;
  const activeDays = new Set<string>();

  for (const log of weekLogs) {
    totalMinutes += log.minutes || 0;
    totalNetKcalLow += log.netKcalLow || 0;
    totalNetKcalHigh += log.netKcalHigh || 0;
    activeDays.add(log.date);
  }

  return {
    dates,
    entries: weekLogs,
    totalMinutes,
    totalNetKcalLow,
    totalNetKcalHigh,
    weekMinutes: totalMinutes,
    weekNetKcalLow: totalNetKcalLow,
    weekNetKcalHigh: totalNetKcalHigh,
    daysActive: activeDays.size,
  };
}

export async function createActivity(args: {
  key?: string;
  date: string;
  type: string;
  minutes: number;
  source: "preset" | "manual" | "steps";
}) {
  const key = args.key ?? "default";
  const profile = await getProfile(key);
  if (!profile) throw new Error("Profile not found");

  const met = ACTIVITY_METS[args.type] ?? 4.0;
  const minutes = args.source === "steps" ? stepsToMinutes(args.minutes) : args.minutes;
  const { low, high } = netKcalRange(met, profile.weightKg, minutes);

  const client = getConvexClient();
  const doc = {
    profileKey: key,
    date: args.date,
    type: args.type,
    minutes,
    steps: args.source === "steps" ? args.minutes : undefined,
    met,
    netKcalLow: low,
    netKcalHigh: high,
    source: args.source,
  };

  return await client.mutation(api.db.insert, {
    table: "activityLogs",
    doc,
  });
}

export async function removeActivity(id: string, key: string = "default") {
  const client = getConvexClient();
  return await client.mutation(api.db.remove, { id });
}
