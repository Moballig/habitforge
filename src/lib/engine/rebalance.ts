import { metNetKcalMinutes } from "./energy";
import type { RebalanceControls, RebalanceInput, RebalancePlan, SpreadDay } from "./types";

const DEFAULTS = {
  windowDays: 4,
  intakeShare: 0.6,
  activityCapNet: 200,
  toleranceKcal: 100,
  coverShare: 0.6,
  preferredMet: 4.3,
} as const;

const MIN_WINDOW = 3;
const MAX_WINDOW = 7;

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

/**
 * Gentle rebalance over 3–7 days (research §5.2 / FR-REBAL-*).
 *
 * Rules encoded:
 * 1. Overshoot only when intake − target > tolerance (default 100)
 * 2. Window 3–7 (default 4)
 * 3. Split intake/activity (default 60/40)
 * 4. Never compensate 100% — cover 50–70% (default 60%)
 * 5. Cap extra activity net kcal/day (default 200)
 * 6. Never push day below floor (default BMR)
 * 7. Doctor-first / restricted → blocked, empty plan
 */
export function rebalance(input: RebalanceInput, controls: RebalanceControls = {}): RebalancePlan {
  const windowDays = clamp(
    Math.round(controls.windowDays ?? DEFAULTS.windowDays),
    MIN_WINDOW,
    MAX_WINDOW,
  );
  const intakeShare = clamp(controls.intakeShare ?? DEFAULTS.intakeShare, 0, 1);
  const activityCapNet = Math.max(0, controls.activityCapNet ?? DEFAULTS.activityCapNet);
  const toleranceKcal = Math.max(0, controls.toleranceKcal ?? DEFAULTS.toleranceKcal);
  const coverShare = clamp(controls.coverShare ?? DEFAULTS.coverShare, 0.5, 0.7);
  const preferredMet = input.preferredMet ?? DEFAULTS.preferredMet;
  const floorKcal = controls.floorKcal ?? input.floorKcal;

  const empty = (reason?: "doctor-first" | "restricted"): RebalancePlan => ({
    safetyMode: input.safetyMode,
    overshootKcal: 0,
    coverShare,
    coveredKcal: 0,
    windowDays,
    intakeShare,
    activityCapNet,
    floorKcal,
    dailyTrimTotal: 0,
    dailyActivityTotal: 0,
    plan: [],
    blocked: true,
    reason,
  });

  if (input.safetyMode === "doctor-first") return empty("doctor-first");
  if (input.safetyMode === "restricted") return empty("restricted");

  const rawOvershoot = input.intakeKcal - input.targetKcal;
  const overshootKcal = rawOvershoot > toleranceKcal ? rawOvershoot : 0;

  if (overshootKcal <= 0 || windowDays <= 0 || input.dates.length === 0) {
    return {
      safetyMode: input.safetyMode,
      overshootKcal: 0,
      coverShare,
      coveredKcal: 0,
      windowDays,
      intakeShare,
      activityCapNet,
      floorKcal,
      dailyTrimTotal: 0,
      dailyActivityTotal: 0,
      plan: [],
      blocked: false,
    };
  }

  // Rule 4: cover 50–70% only
  const coveredKcal = overshootKcal * coverShare;

  const intakePortion = coveredKcal * intakeShare;
  const activityPortion = coveredKcal * (1 - intakeShare);

  let dailyTrimTotal = intakePortion / windowDays;
  let dailyActivityTotal = activityPortion / windowDays;

  // Rule 5: activity cap
  if (dailyActivityTotal > activityCapNet) {
    const excess = dailyActivityTotal - activityCapNet;
    dailyActivityTotal = activityCapNet;
    // Move un-coverable activity into trims (still ≤ covered budget)
    dailyTrimTotal += excess / windowDays;
  }

  // Per-day floor clamp (rule 6): target assumed ≥ floor when target is BMR-based;
  // trim is subtracted from target — if target − trim < floor, clamp trim.
  const days: SpreadDay[] = [];
  const n = Math.min(windowDays, input.dates.length);
  let floorClamped = false;

  for (let i = 0; i < n; i++) {
    let trim = dailyTrimTotal;
    // Assume the day starts at targetKcal; never end below floor.
    const maxTrim = Math.max(0, input.targetKcal - floorKcal);
    if (trim > maxTrim) {
      trim = maxTrim;
      floorClamped = true;
    }

    const activityKcal = Math.min(dailyActivityTotal, activityCapNet);
    const met = preferredMet;
    const weight = Math.max(1, input.weightKg);
    // minutes from net kcal: minutes = net / ((MET-1)*kg/60)
    const kcalPerMin = Math.max(0.01, metNetKcalMinutes(met, weight, 60) / 60);
    const activityMin = Math.round(activityKcal / kcalPerMin);

    days.push({
      date: input.dates[i],
      trimKcal: Math.round(trim),
      activityKcal: Math.round(activityKcal),
      activityMin,
      floorClamped: false,
    });
  }

  // If floor clamped, mark those days
  if (floorClamped) {
    const maxTrim = Math.max(0, input.targetKcal - floorKcal);
    for (const d of days) {
      if (d.trimKcal >= Math.round(maxTrim) && dailyTrimTotal > maxTrim) {
        d.floorClamped = true;
      }
    }
  }

  // Rule 4 safety: never plan full compensation
  const plannedTotal =
    days.reduce((s, d) => s + d.trimKcal + d.activityKcal, 0);
  if (plannedTotal >= overshootKcal) {
    // Scale down hard to stay under overshoot (never 100%)
    const scale = (overshootKcal * 0.95) / plannedTotal;
    for (const d of days) {
      d.trimKcal = Math.round(d.trimKcal * scale);
      d.activityKcal = Math.round(d.activityKcal * scale);
      const kcalPerMin = Math.max(
        0.01,
        metNetKcalMinutes(preferredMet, Math.max(1, input.weightKg), 60) / 60,
      );
      d.activityMin = Math.round(d.activityKcal / kcalPerMin);
    }
  }

  return {
    safetyMode: input.safetyMode,
    overshootKcal: Math.round(overshootKcal),
    coverShare,
    coveredKcal: Math.round(coveredKcal),
    windowDays: n,
    intakeShare,
    activityCapNet,
    floorKcal,
    dailyTrimTotal: Math.round(dailyTrimTotal),
    dailyActivityTotal: Math.round(dailyActivityTotal),
    plan: days,
    blocked: false,
  };
}

/**
 * Planned-feast pre-bank (rule 8): how much to trim before a social day
 * so the feast sits inside the weekly budget.
 */
export function feastPreBank(opts: {
  feastExtraKcal: number;
  daysBefore: number;
  floorKcal: number;
  targetKcal: number;
  coverShare?: number;
}): number {
  const cover = clamp(opts.coverShare ?? 0.6, 0.5, 0.7);
  const days = clamp(opts.daysBefore, 1, 7);
  const total = opts.feastExtraKcal * cover;
  const perDay = total / days;
  const maxTrim = Math.max(0, opts.targetKcal - opts.floorKcal);
  return Math.round(Math.min(perDay, maxTrim));
}

export interface PostFeastPlanDay {
  dayIndex: number;
  trimKcal: number;
  extraWalkMinutes: number;
  activityNetKcal: number;
  noteEn: string;
  noteBn: string;
}

export interface PostFeastRecoveryResult {
  coveredKcal: number;
  totalOvershootKcal: number;
  coveragePercent: number;
  days: number;
  dailyTrimKcal: number;
  dailyWalkMinutes: number;
  dailyActivityNetKcal: number;
  schedule: PostFeastPlanDay[];
  safeFloorProtected: boolean;
}

/**
 * Post-feast recovery (rule 8 after-event counterpart):
 * Generates a gentle 2–5 day catch-up plan after an unplanned feast/dawat.
 * Respects 50–70% cover cap (never 100%), 60/40 food/activity split,
 * personal BMR floor, and 200 kcal/day activity cap.
 */
export function postFeastRecovery(opts: {
  overshootKcal: number;
  recoveryDays?: number;
  targetKcal: number;
  floorKcal: number;
  weightKg?: number;
  coverShare?: number;
}): PostFeastRecoveryResult {
  const overshoot = Math.max(0, opts.overshootKcal);
  const days = clamp(opts.recoveryDays ?? 3, 2, 5);
  const cover = clamp(opts.coverShare ?? 0.6, 0.5, 0.7);
  const totalToCover = Math.round(overshoot * cover);

  // 60% intake trim, 40% light activity
  const foodShareKcal = totalToCover * 0.6;
  const activityShareKcal = totalToCover * 0.4;

  const rawDailyTrim = Math.round(foodShareKcal / days);
  const maxAllowableTrim = Math.max(0, opts.targetKcal - opts.floorKcal);
  const dailyTrim = Math.min(rawDailyTrim, maxAllowableTrim);
  const safeFloorProtected = rawDailyTrim > maxAllowableTrim;

  const weight = opts.weightKg ?? 65;
  const rawDailyActivityKcal = Math.round(activityShareKcal / days);
  // Cap extra activity at 200 net kcal per day (rule 5)
  const dailyActivityNet = Math.min(200, Math.max(0, rawDailyActivityKcal));

  // Net kcal per minute for brisk walk (MET 4.3 -> net MET 3.3)
  const kcalPerMinute = Math.max(1.5, (3.3 * weight) / 60);
  const dailyWalkMinutes = Math.min(45, Math.max(10, Math.round(dailyActivityNet / kcalPerMinute)));

  const schedule: PostFeastPlanDay[] = Array.from({ length: days }, (_, i) => ({
    dayIndex: i + 1,
    trimKcal: dailyTrim,
    extraWalkMinutes: dailyWalkMinutes,
    activityNetKcal: dailyActivityNet,
    noteEn: `Day ${i + 1}: −${dailyTrim} kcal food trim + ${dailyWalkMinutes} min walk (≈${dailyActivityNet} kcal)`,
    noteBn: `দিন ${i + 1}: −${dailyTrim} ক্যালরি খাবার সাশ্রয় + ${dailyWalkMinutes} মিনিট হাঁটা (≈${dailyActivityNet} ক্যালরি)`,
  }));

  const actualCovered = (dailyTrim + dailyActivityNet) * days;

  return {
    coveredKcal: actualCovered,
    totalOvershootKcal: overshoot,
    coveragePercent: Math.round(cover * 100),
    days,
    dailyTrimKcal: dailyTrim,
    dailyWalkMinutes,
    dailyActivityNetKcal: dailyActivityNet,
    schedule,
    safeFloorProtected,
  };
}

