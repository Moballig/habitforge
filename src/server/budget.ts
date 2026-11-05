"use server";

import { getProfile, getEnergy } from "./profile";
import { listMealsByDate } from "./meals";
import { rebalance } from "../lib/engine/rebalance";

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

async function computeBudget(key: string, today: string, extraKcal: number = 0) {
  const profile = await getProfile(key);
  if (!profile) return null;

  const energy = await getEnergy(key);
  if (!energy) return null;

  const dates = weekDates(today);
  const series: Array<{ date: string; kcal: number; target: number }> = [];
  let weeklyUsed = 0;
  let loggedDays = 0;

  for (const date of dates) {
    const meals = await listMealsByDate(date, key);
    let dayKcal = 0;
    for (const meal of meals) {
      for (const item of meal.items || []) {
        dayKcal += (item.kcalLow + item.kcalHigh) / 2;
      }
    }
    if (date === today) {
      dayKcal += extraKcal;
    }
    if (meals.length > 0 || (date === today && extraKcal > 0)) {
      loggedDays += 1;
    }
    const rounded = Math.round(dayKcal);
    series.push({ date, kcal: rounded, target: energy.targetKcal });
    weeklyUsed += rounded;
  }

  const weeklyBudget = energy.targetKcal * 7;
  const remaining = Math.max(0, weeklyBudget - weeklyUsed);
  const todayEntry = series.find((s) => s.date === today);
  const todayUsed = todayEntry?.kcal ?? 0;
  const todayOver = Math.max(0, todayUsed - energy.targetKcal);

  const rebalancePlan = rebalance(
    {
      dates,
      intakeKcal: todayUsed,
      targetKcal: energy.targetKcal,
      floorKcal: energy.floorKcal,
      safetyMode: profile.safetyMode,
      weightKg: profile.weightKg,
    },
    {
      windowDays: profile.budgetControls?.windowDays,
      intakeShare: profile.budgetControls?.intakeShare,
    },
  );

  return {
    weeklyBudget,
    weeklyUsed,
    remaining,
    name: profile.name,
    dailyTarget: energy.targetKcal,
    dailyTargetKcal: energy.targetKcal,
    todayUsed,
    todayOver,
    overshootKcal: todayOver,
    toleranceKcal: 100,
    windowDays: rebalancePlan.windowDays,
    intakeShare: rebalancePlan.intakeShare,
    floorKcal: energy.floorKcal,
    activityCapNet: rebalancePlan.activityCapNet,
    blocked: rebalancePlan.blocked,
    reason: rebalancePlan.reason,
    dailyTrim: rebalancePlan.dailyTrimTotal,
    dailyActivityMin: rebalancePlan.dailyActivityTotal > 0 ? 30 : 0,
    dailyActivityKcal: rebalancePlan.dailyActivityTotal,
    safetyMode: profile.safetyMode,
    weekStart: dates[0],
    series,
    plan: rebalancePlan.plan,
    rebalancePlan,
  };
}

export async function getBudget(today: string, key: string = "default") {
  return await computeBudget(key, today, 0);
}

export async function getWhatIf(today: string, extraKcal: number, key: string = "default") {
  return await computeBudget(key, today, extraKcal);
}

export async function simulateWhatIf(today: string, extraKcal: number, key: string = "default") {
  return await computeBudget(key, today, extraKcal);
}
