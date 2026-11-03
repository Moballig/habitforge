import { FOOD_SEED } from "./seed";

export type PlateGroup = "veg" | "protein" | "grains" | "other";

// 0-based index ranges follow FOOD_SEED's 17 section comments
// (verified: 318 rows — 20/15/21/20/38/15/32/10/12/10/12/10/8/24/13/13/45).
const RANGES: Array<{ from: number; to: number; group: PlateGroup }> = [
  { from: 0, to: 19, group: "grains" }, // Grains & starches
  { from: 20, to: 34, group: "protein" }, // Pulses / dal
  { from: 35, to: 55, group: "protein" }, // Fish & seafood
  { from: 56, to: 75, group: "protein" }, // Meat & eggs
  { from: 76, to: 113, group: "veg" }, // Vegetables
  { from: 114, to: 128, group: "other" }, // Dairy & drinks
  { from: 129, to: 160, group: "other" }, // Street / snacks
  { from: 161, to: 170, group: "other" }, // Condiments, oils, extras
  { from: 171, to: 182, group: "veg" }, // More vegetables
  { from: 183, to: 192, group: "protein" }, // More fish preparations
  { from: 193, to: 204, group: "protein" }, // More meat preparations
  { from: 205, to: 214, group: "protein" }, // More pulses / dals
  { from: 215, to: 222, group: "protein" }, // Dairy
  { from: 223, to: 246, group: "veg" }, // Fruits
  { from: 247, to: 259, group: "other" }, // Street food / snacks
  { from: 260, to: 272, group: "other" }, // Beverages
  { from: 273, to: 317, group: "other" }, // Mixed staples & dishes
];

const indexByNameEn = new Map(FOOD_SEED.map((f, i) => [f.nameEn, i]));

/** Plate group for a seed food by English name; unknown foods count as "other". */
export function plateGroupFor(nameEn: string): PlateGroup {
  const idx = indexByNameEn.get(nameEn);
  if (idx === undefined) return "other";
  return RANGES.find((r) => idx >= r.from && idx <= r.to)?.group ?? "other";
}
