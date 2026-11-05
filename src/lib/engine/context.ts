/** US AQI ≥151 = "Unhealthy" (EPA scale). shortcut: swap for a local DAQMS scale when localizing. */
export const POOR_AQI = 151;
/** Apparent-temperature extreme-heat threshold (°C). */
export const HEAT_APPARENT_C = 38;

export type BdDivision =
  | "dhaka"
  | "chattogram"
  | "sylhet"
  | "rajshahi"
  | "khulna"
  | "barishal"
  | "rangpur"
  | "mymensingh";

export interface BdRegionCoords {
  id: BdDivision;
  nameEn: string;
  nameBn: string;
  lat: number;
  lon: number;
}

export const BD_REGIONS: Record<BdDivision, BdRegionCoords> = {
  dhaka: { id: "dhaka", nameEn: "Dhaka", nameBn: "ঢাকা", lat: 23.8103, lon: 90.4125 },
  chattogram: { id: "chattogram", nameEn: "Chattogram", nameBn: "চট্টগ্রাম", lat: 22.3569, lon: 91.7832 },
  sylhet: { id: "sylhet", nameEn: "Sylhet", nameBn: "সিলেট", lat: 24.8949, lon: 91.8687 },
  rajshahi: { id: "rajshahi", nameEn: "Rajshahi", nameBn: "রাজশাহী", lat: 24.3636, lon: 88.6241 },
  khulna: { id: "khulna", nameEn: "Khulna", nameBn: "খুলনা", lat: 22.8456, lon: 89.5403 },
  barishal: { id: "barishal", nameEn: "Barishal", nameBn: "বরিশাল", lat: 22.7010, lon: 90.3535 },
  rangpur: { id: "rangpur", nameEn: "Rangpur", nameBn: "রংপুর", lat: 25.7439, lon: 89.2752 },
  mymensingh: { id: "mymensingh", nameEn: "Mymensingh", nameBn: "ময়মনসিংহ", lat: 24.7471, lon: 90.4203 },
};

export function getRegionCoords(region?: string | null): BdRegionCoords {
  if (region && region in BD_REGIONS) {
    return BD_REGIONS[region as BdDivision];
  }
  return BD_REGIONS.dhaka;
}

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
