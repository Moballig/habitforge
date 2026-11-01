import type { FoodItem } from "../types";
import { searchFoods } from "./search";

export type MealClause = {
  raw: string;
  searchText: string;
  quantity: number;
  requestedUnit?: string;
  candidates: FoodItem[];
};

export type LocalMealPick = {
  raw: string;
  food: FoodItem;
  quantity: number;
  unit: string;
};

const BANGLA_DIGITS: Record<string, string> = {
  "০": "0",
  "১": "1",
  "২": "2",
  "৩": "3",
  "৪": "4",
  "৫": "5",
  "৬": "6",
  "৭": "7",
  "৮": "8",
  "৯": "9",
};

const QUANTITY_WORDS: Record<string, number> = {
  one: 1,
  ek: 1,
  ekta: 1,
  "এক": 1,
  "একটা": 1,
  "১টা": 1,
  two: 2,
  dui: 2,
  duita: 2,
  "দুই": 2,
  "দুইটা": 2,
  "২টা": 2,
  three: 3,
  tin: 3,
  tinta: 3,
  "তিন": 3,
  "তিনটা": 3,
  half: 0.5,
  adha: 0.5,
  "আধা": 0.5,
};

const STOP_WORDS = new Set([
  "today",
  "sokale",
  "dupure",
  "bikale",
  "rate",
  "breakfast",
  "lunch",
  "dinner",
  "snack",
  "kheyechi",
  "kheyechhi",
  "khelam",
  "khabo",
  "ate",
  "had",
  "আজ",
  "সকালে",
  "দুপুরে",
  "বিকালে",
  "রাতে",
  "খেয়েছি",
  "খেয়েছি",
  "খাব",
]);

const UNITS: Array<{ pattern: RegExp; value: string }> = [
  { pattern: /\b(?:half\s+plate)\b|আধা\s*প্লেট/iu, value: "plate" },
  { pattern: /\b(?:bati|বাটি)\b/iu, value: "bati" },
  { pattern: /\b(?:bowl|বোল)\b/iu, value: "bowl" },
  { pattern: /\b(?:plate|প্লেট)\b/iu, value: "plate" },
  { pattern: /\b(?:piece|pis|pc|পিস|টি|টা)\b/iu, value: "piece" },
  { pattern: /\b(?:cup|কাপ)\b/iu, value: "cup" },
  { pattern: /\b(?:glass|গ্লাস)\b/iu, value: "glass" },
  { pattern: /\b(?:spoon|chamoch|চামচ)\b/iu, value: "spoon" },
];

function normalizeDigits(value: string): string {
  return value.replace(/[০-৯]/g, (digit) => BANGLA_DIGITS[digit] ?? digit);
}

function splitClauses(line: string): string[] {
  return line
    .split(/\s*(?:,|;|\+|\/|।)\s*|\s+(?:and|ar|ebong|আর|এবং|ও)\s+/giu)
    .map((part) => part.trim())
    .filter(Boolean);
}

function quantityFrom(raw: string): number {
  const normalized = normalizeDigits(raw).toLowerCase();
  const numberMatch = normalized.match(/(?:^|\s)(\d+(?:\.\d+)?)(?=\s|$)/u);
  if (numberMatch) return Math.max(0.25, Number(numberMatch[1]));
  for (const [word, quantity] of Object.entries(QUANTITY_WORDS)) {
    if (normalized.split(/\s+/u).includes(word)) return quantity;
  }
  return 1;
}

function unitFrom(raw: string): string | undefined {
  return UNITS.find(({ pattern }) => pattern.test(raw))?.value;
}

function cleanForSearch(raw: string): string {
  const normalized = normalizeDigits(raw).toLowerCase();
  const withoutUnits = UNITS.reduce(
    (value, unit) => value.replace(unit.pattern, " "),
    normalized,
  );
  return withoutUnits
    .replace(/\d+(?:\.\d+)?/gu, " ")
    .split(/\s+/u)
    .filter((word) => word && !(word in QUANTITY_WORDS) && !STOP_WORDS.has(word))
    .join(" ")
    .trim();
}

export function resolveMealUnit(food: FoodItem, requestedUnit?: string): string {
  if (!requestedUnit) return food.measures[0]?.label ?? "portion";
  const match = food.measures.find((measure) => {
    const label = measure.label.toLowerCase();
    return label.includes(requestedUnit) || requestedUnit.includes(label);
  });
  return match?.label ?? food.measures[0]?.label ?? "portion";
}

/** Split a meal line and return up to five local candidates per food clause. */
export function getMealClauses(line: string): MealClause[] {
  return splitClauses(line)
    .map((raw) => {
      const searchText = cleanForSearch(raw);
      return {
        raw,
        searchText,
        quantity: quantityFrom(raw),
        requestedUnit: unitFrom(raw),
        candidates: searchFoods(searchText),
      };
    })
    .filter((clause) => clause.searchText && clause.candidates.length > 0);
}

/** Unique candidate pool sent to ai.parseMeal; no profile or health data. */
export function getMealCandidatePool(line: string): FoodItem[] {
  const unique = new Map<string, FoodItem>();
  for (const clause of getMealClauses(line)) {
    for (const food of clause.candidates) unique.set(food.id, food);
  }
  return [...unique.values()].slice(0, 25);
}

/** Offline/rate-limit fallback: take each clause's highest-scored local food. */
export function parseMealLineLocal(line: string): LocalMealPick[] {
  return getMealClauses(line).map((clause) => {
    const food = clause.candidates[0];
    return {
      raw: clause.raw,
      food,
      quantity: clause.quantity,
      unit: resolveMealUnit(food, clause.requestedUnit),
    };
  });
}
