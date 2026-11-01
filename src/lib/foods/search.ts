// Client-side food search over bundled seed — works offline.
// Convex foods.search is the server fallback for grown DB (300–500 rows).
import { FOOD_SEED } from "./seed";
import type { FoodItem, LoggedItem, SourceTag } from "../types";

type SeedFood = (typeof FOOD_SEED)[number];

function toFoodItem(s: SeedFood, id: string): FoodItem {
  return {
    id,
    nameBn: s.nameBn,
    nameEn: s.nameEn,
    aliases: s.aliases,
    kcalPer100: s.kcalPer100,
    proteinPer100: s.proteinPer100,
    carbPer100: s.carbPer100,
    fatPer100: s.fatPer100,
    measures: s.measures,
    sourceTag: s.sourceTag as SourceTag,
    isCooked: s.isCooked,
    rangeLow: s.rangeLow,
    rangeHigh: s.rangeHigh,
  };
}

export const OFFLINE_FOODS: FoodItem[] = FOOD_SEED.map((food, index) =>
  toFoodItem(food, `seed-${index}`),
);

export function getOfflineFood(id: string): FoodItem | undefined {
  return OFFLINE_FOODS.find((food) => food.id === id);
}

function normalizeSearch(value: string): string {
  return value
    .toLowerCase()
    .replace(/[()]/g, " ")
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreField(field: string, query: string): number {
  const normalized = normalizeSearch(field);
  if (normalized === query) return 120;
  if (normalized.startsWith(query)) return 80;
  if (normalized.includes(query)) return 55;
  const terms = query.split(" ").filter(Boolean);
  if (terms.length > 1 && terms.every((term) => normalized.includes(term))) {
    return 35 + terms.length;
  }
  return 0;
}

/** Fuzzy search over bundled seed: nameEn, nameBn, aliases. Returns top 5. */
export function searchFoods(q: string): FoodItem[] {
  const s = normalizeSearch(q);
  if (!s) return [];
  const scored: { food: FoodItem; score: number }[] = [];
  OFFLINE_FOODS.forEach((food) => {
    const score = Math.max(
      scoreField(food.nameEn, s),
      scoreField(food.nameBn, s),
      ...food.aliases.map((alias) => scoreField(alias, s)),
    );
    if (score > 0) scored.push({ food, score });
  });
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((x) => x.food);
}

/** Convert food + qty + unit label → LoggedItem with kcal range. Code computes, never LLM. */
export function toLoggedItem(
  f: FoodItem,
  qty: number,
  unitLabel: string,
): LoggedItem {
  const m = f.measures.find((x) => x.label === unitLabel) ?? f.measures[0];
  return toLoggedItemFromGrams(f, m.grams * qty, unitLabel, qty);
}

/** Convert a known gram amount → LoggedItem. Used by shared-pot/photo flows. */
export function toLoggedItemFromGrams(
  f: FoodItem,
  grams: number,
  unitLabel: string,
  quantity = 1,
): LoggedItem {
  const factor = grams / 100;
  const mid = f.kcalPer100 * factor;
  const low = f.rangeLow !== undefined ? f.rangeLow * factor : mid * 0.85;
  const high = f.rangeHigh !== undefined ? f.rangeHigh * factor : mid * 1.15;
  return {
    foodId: f.id,
    nameBn: f.nameBn,
    nameEn: f.nameEn,
    quantity,
    unit: unitLabel,
    grams: Math.round(grams),
    kcalLow: Math.round(low),
    kcalHigh: Math.round(high),
    sourceTag: f.sourceTag,
  };
}

/** Today's date as YYYY-MM-DD (local time). */
export function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Yesterday's date as YYYY-MM-DD. */
export function yesterdayISO(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
