/** US AQI ≥151 = "Unhealthy" (EPA scale). shortcut: swap for a local DAQMS scale when localizing. */
export const POOR_AQI = 151;
/** Apparent-temperature extreme-heat threshold (°C). */
export const HEAT_APPARENT_C = 38;

/**
 * Wave-4 gate: poor AQI or extreme heat → indoor suggestions (FR-D-05).
 * null readings never trigger the switch (source down = no advice).
 */
export function outdoorAdvice(
  aqi: number | null,
  feelsC: number | null,
): { indoor: boolean; reason: "aqi" | "heat" | null } {
  const poor = aqi !== null && aqi >= POOR_AQI;
  const hot = feelsC !== null && feelsC >= HEAT_APPARENT_C;
  return { indoor: poor || hot, reason: poor ? "aqi" : hot ? "heat" : null };
}
