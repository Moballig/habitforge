/**
 * Cheap Protein & Taka-Aware Food Economics Engine (Wave 6 - FR-G-05)
 * Combines local food nutrient density with live market commodity price snapshots
 * to compute grams of protein per 100 Taka and lowest-cost protein options.
 */

export interface ProteinCostItem {
  id: string;
  nameEn: string;
  nameBn: string;
  category: "staple_dal" | "fish" | "egg_poultry" | "soy_seeds" | "dairy";
  proteinPer100g: number;
  kcalPer100g: number;
  typicalServingGrams: number;
  pricePerKgBDT: number;
  proteinPer100BDT: number; // Grams of protein obtained for 100 Taka
  costPer20gProteinBDT: number; // Cost in Taka to get 20g protein (one solid meal portion)
  sourceTag: string;
  priceDate: string;
}

/**
 * Verified staples benchmarked against WFP/TCB market rates (Dhaka/National 2026).
 * Prices reflect latest market observations (e.g. Masur dal ~130/kg, Eggs ~12.5/pc = ~210/kg, Pangas ~180/kg, Chola ~100/kg).
 */
export const DESHI_PROTEIN_BENCHMARKS: ProteinCostItem[] = [
  {
    id: "masur-dal",
    nameEn: "Red Lentils (Masur dal)",
    nameBn: "মসুর ডাল",
    category: "staple_dal",
    proteinPer100g: 25.1,
    kcalPer100g: 343,
    typicalServingGrams: 50, // raw equivalent for a thick bati
    pricePerKgBDT: 130,
    proteinPer100BDT: Math.round((25.1 / 130) * 100 * 10) / 10, // ~19.3g
    costPer20gProteinBDT: Math.round((20 / 25.1) * 130 * 10) / 10, // ~103.6 BDT
    sourceTag: "FCTB 2013 / WFP 2026",
    priceDate: "2026-05",
  },
  {
    id: "khesari-dal",
    nameEn: "Grass Pea (Khesari dal)",
    nameBn: "খেসারী ডাল",
    category: "staple_dal",
    proteinPer100g: 28.2,
    kcalPer100g: 345,
    typicalServingGrams: 50,
    pricePerKgBDT: 95,
    proteinPer100BDT: Math.round((28.2 / 95) * 100 * 10) / 10, // ~29.7g
    costPer20gProteinBDT: Math.round((20 / 28.2) * 95 * 10) / 10, // ~67.4 BDT
    sourceTag: "FCTB 2013 / WFP 2026",
    priceDate: "2026-05",
  },
  {
    id: "chickpeas-chola",
    nameEn: "Chickpeas (Chola / Booter dal)",
    nameBn: "ছোলা / বুটের ডাল",
    category: "staple_dal",
    proteinPer100g: 20.5,
    kcalPer100g: 360,
    typicalServingGrams: 60,
    pricePerKgBDT: 105,
    proteinPer100BDT: Math.round((20.5 / 105) * 100 * 10) / 10, // ~19.5g
    costPer20gProteinBDT: Math.round((20 / 20.5) * 105 * 10) / 10,
    sourceTag: "FCTB 2013 / WFP 2026",
    priceDate: "2026-05",
  },
  {
    id: "farm-egg",
    nameEn: "Farm Chicken Egg (Dim)",
    nameBn: "ফার্মের মুরগির ডিম",
    category: "egg_poultry",
    proteinPer100g: 13.3, // ~6.5g per 50g egg
    kcalPer100g: 155,
    typicalServingGrams: 50, // 1 egg
    pricePerKgBDT: 230, // ~13.8 BDT per egg
    proteinPer100BDT: Math.round((13.3 / 230) * 100 * 10) / 10, // ~5.8g
    costPer20gProteinBDT: Math.round((20 / 13.3) * 230 * 10) / 10,
    sourceTag: "FCTB 2013 / TCB 2026",
    priceDate: "2026-07",
  },
  {
    id: "pangas-fish",
    nameEn: "Pangas Fish (Pangas mach)",
    nameBn: "পাঙ্গাশ মাছ",
    category: "fish",
    proteinPer100g: 16.5,
    kcalPer100g: 125,
    typicalServingGrams: 120, // 1 good piece
    pricePerKgBDT: 190,
    proteinPer100BDT: Math.round((16.5 / 190) * 100 * 10) / 10, // ~8.7g
    costPer20gProteinBDT: Math.round((20 / 16.5) * 190 * 10) / 10,
    sourceTag: "FCTB 2013 / TCB 2026",
    priceDate: "2026-07",
  },
  {
    id: "tilapia-fish",
    nameEn: "Tilapia Fish",
    nameBn: "তেলাপিয়া মাছ",
    category: "fish",
    proteinPer100g: 18.0,
    kcalPer100g: 110,
    typicalServingGrams: 120,
    pricePerKgBDT: 220,
    proteinPer100BDT: Math.round((18.0 / 220) * 100 * 10) / 10, // ~8.2g
    costPer20gProteinBDT: Math.round((20 / 18.0) * 220 * 10) / 10,
    sourceTag: "FCTB 2013 / TCB 2026",
    priceDate: "2026-07",
  },
  {
    id: "broiler-chicken",
    nameEn: "Broiler Chicken",
    nameBn: "ব্রয়লার মুরগি",
    category: "egg_poultry",
    proteinPer100g: 21.0,
    kcalPer100g: 165,
    typicalServingGrams: 100,
    pricePerKgBDT: 185,
    proteinPer100BDT: Math.round((21.0 / 185) * 100 * 10) / 10, // ~11.4g
    costPer20gProteinBDT: Math.round((20 / 21.0) * 185 * 10) / 10,
    sourceTag: "FCTB 2013 / TCB 2026",
    priceDate: "2026-07",
  },
  {
    id: "dried-fish-shutki",
    nameEn: "Chela / Loitta Dried Fish (Shutki)",
    nameBn: "লইট্টা / চেলা শুঁটকি",
    category: "fish",
    proteinPer100g: 58.0, // Concentrated protein
    kcalPer100g: 310,
    typicalServingGrams: 30, // cooked bhorta portion
    pricePerKgBDT: 650,
    proteinPer100BDT: Math.round((58.0 / 650) * 100 * 10) / 10, // ~8.9g
    costPer20gProteinBDT: Math.round((20 / 58.0) * 650 * 10) / 10,
    sourceTag: "FCTB 2013 / Bazar 2026",
    priceDate: "2026-06",
  },
  {
    id: "soybean-seeds",
    nameEn: "Soybean / Garikalai (Cooked curry)",
    nameBn: "সয়াবিন দানা / গাড়িকালাই",
    category: "soy_seeds",
    proteinPer100g: 36.0,
    kcalPer100g: 410,
    typicalServingGrams: 40,
    pricePerKgBDT: 140,
    proteinPer100BDT: Math.round((36.0 / 140) * 100 * 10) / 10, // ~25.7g!
    costPer20gProteinBDT: Math.round((20 / 36.0) * 140 * 10) / 10, // ~77.8 BDT
    sourceTag: "FCTB 2013 / Bazar 2026",
    priceDate: "2026-06",
  },
  {
    id: "tofu-local",
    nameEn: "Local Soya Paneer / Tofu",
    nameBn: "সয়া পনির / টোফু",
    category: "soy_seeds",
    proteinPer100g: 14.5,
    kcalPer100g: 120,
    typicalServingGrams: 100,
    pricePerKgBDT: 240,
    proteinPer100BDT: Math.round((14.5 / 240) * 100 * 10) / 10,
    costPer20gProteinBDT: Math.round((20 / 14.5) * 240 * 10) / 10,
    sourceTag: "IFCT 2017 / Local 2026",
    priceDate: "2026-06",
  },
  {
    id: "milk-fresh",
    nameEn: "Fresh Cow Milk (Goru Dudh)",
    nameBn: "গরুর তরল দুধ",
    category: "dairy",
    proteinPer100g: 3.3,
    kcalPer100g: 67,
    typicalServingGrams: 250, // 1 glass
    pricePerKgBDT: 90, // ~90 BDT/Liter
    proteinPer100BDT: Math.round((3.3 / 90) * 100 * 10) / 10,
    costPer20gProteinBDT: Math.round((20 / 3.3) * 90 * 10) / 10,
    sourceTag: "FCTB 2013 / Local 2026",
    priceDate: "2026-07",
  },
];

/**
 * Returns protein benchmarks sorted by highest protein per 100 BDT (cheapest source first).
 */
export function getCheapestProteinSources(
  filterCategory?: "staple_dal" | "fish" | "egg_poultry" | "soy_seeds" | "dairy",
): ProteinCostItem[] {
  const list = filterCategory
    ? DESHI_PROTEIN_BENCHMARKS.filter((item) => item.category === filterCategory)
    : [...DESHI_PROTEIN_BENCHMARKS];
  return list.sort((a, b) => b.proteinPer100BDT - a.proteinPer100BDT);
}

/**
 * Calculates a daily protein budget recommendation in Taka based on user target.
 * Target: e.g. 60g protein/day.
 */
export function calculateProteinDailyCost(targetProteinGrams: number): {
  targetGrams: number;
  lowCostBDT: number; // using Dal + Soybean + Pangas mix
  balancedCostBDT: number; // using Eggs + Fish + Dal mix
  premiumCostBDT: number; // using Mutton/Beef/Hilsa
} {
  // Lowest cost tier: ~22g protein / 100 BDT -> ~4.5 BDT per gram of protein
  const lowCost = Math.round(targetProteinGrams * 4.5);
  // Balanced tier: ~12g protein / 100 BDT -> ~8.3 BDT per gram of protein
  const balancedCost = Math.round(targetProteinGrams * 8.3);
  // Premium tier: beef/mutton/hilsa ~22 BDT per gram of protein
  const premiumCost = Math.round(targetProteinGrams * 22);

  return {
    targetGrams: targetProteinGrams,
    lowCostBDT: lowCost,
    balancedCostBDT: balancedCost,
    premiumCostBDT: premiumCost,
  };
}
