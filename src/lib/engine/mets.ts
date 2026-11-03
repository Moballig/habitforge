import { metNetKcalMinutes } from "./energy";

/**
 * METs for preset activities (FR-D-01). Values follow the Compendium of
 * Physical Activities where an entry exists; cricket has no compendium row
 * and uses a moderate-effort estimate.
 */
export const ACTIVITY_METS: Record<string, number> = {
  walk: 4.3, // 3.5 mph brisk walking
  cycle: 6.0, // general cycling
  home: 3.8, // calisthenics, moderate effort
  cricket: 4.0, // batting/fielding estimate
  yoga: 2.5, // hath yoga
  chores: 3.0, // moderate housework
  steps: 4.3, // walking equivalent used for step conversion
};

/** Default minutes logged per preset tap (FR-D-01). */
export const DEFAULT_MINUTES: Record<string, number> = {
  walk: 30,
  cycle: 30,
  home: 20,
  cricket: 60,
  yoga: 20,
  chores: 15,
};

/** ~100 steps/min brisk-pace walking equivalent (FR-D-02 web substitute). */
export function stepsToMinutes(steps: number): number {
  return Math.max(1, Math.round(steps / 100));
}

/**
 * Net kcal range (MET − 1) with a ±15% band for intensity variation;
 * net, not gross, so exercise is never over-credited (FR-D-03).
 * Hand-check: walk, 70 kg, 30 min → net 3.3 × 70 × 0.5 = 115.5 → 98–133.
 */
export function netKcalRange(
  met: number,
  weightKg: number,
  minutes: number,
): { low: number; high: number } {
  const net = metNetKcalMinutes(met, weightKg, minutes);
  return { low: Math.round(net * 0.85), high: Math.round(net * 1.15) };
}
