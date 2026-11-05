import { KCAL_PER_KG } from "./energy";
import type { AdaptiveTdeeInput, AdaptiveTdeeResult } from "./types";

/**
 * Adaptive TDEE (research §5.3 / FR-ATDEE-*).
 * TDEE ≈ avgIntake − (weightDeltaKg × 7700 ÷ days)
 * Blend slowly with formula estimate until ~2–3 weeks of data.
 */
export function adaptiveTdee(input: AdaptiveTdeeInput): AdaptiveTdeeResult {
  const days = Math.max(1, input.days);
  const weighIns = Math.max(0, input.weighIns);

  const raw =
    input.avgIntakeKcal - (input.weightDeltaKg * KCAL_PER_KG) / days;

  // Confidence: needs ~14 days and several weigh-ins to settle (2–3 weeks)
  const dayFactor = Math.min(1, days / 14);
  const weighFactor = Math.min(1, weighIns / 7);
  const confidence = Math.round(dayFactor * weighFactor * 100) / 100;

  // Blend weight toward formula when confidence is low
  // Thin data (confidence < 0.2) stays on the formula estimate (FR-ATDEE-01)
  const blend = confidence < 0.2 ? 0 : confidence;
  const estimateKcal = Math.round(
    input.formulaTdee * (1 - blend) + raw * blend,
  );

  let status: AdaptiveTdeeResult["status"] = "formula";
  if (days >= 14 && weighIns >= 7) status = "settled";
  else if (days >= 5 || weighIns >= 3) status = "improving";

  const moreWeighInsNeeded = Math.max(0, 7 - weighIns);

  return {
    estimateKcal,
    confidence,
    status,
    moreWeighInsNeeded,
    // Water/salt/Eid/menstrual noise warning when we have some but not settled data
    noiseNote: status !== "settled",
  };
}

/**
 * 7-day rolling smoothed weight trend to filter scale noise (FR-E-10).
 * Prevents scale panic from glycogen/water spikes after feasts, travel, or cycles.
 */
export function smoothWeightTrend(weights: number[]): number[] {
  if (weights.length === 0) return [];
  const smoothed: number[] = [];
  for (let i = 0; i < weights.length; i++) {
    const start = Math.max(0, i - 6);
    const window = weights.slice(start, i + 1);
    const avg = window.reduce((sum, w) => sum + w, 0) / window.length;
    smoothed.push(Math.round(avg * 10) / 10);
  }
  return smoothed;
}
