"use server";

import { getConvexClient, api } from "./convex";
import type { Id } from "../../convex/_generated/dataModel";
import { plateGroupFor } from "../lib/foods/groups";

export type MealSlot = "breakfast" | "lunch" | "snacks" | "dinner";
export type InputSlot = MealSlot | "snack" | "sehri" | "iftar";

export type MealSourceTag =
  | "measured"
  | "fctb"
  | "borrowed"
  | "user"
  | "estimated"
  | "estimated-recipe"
  | "ai-assisted";

export type MealItemInput = {
  foodId?: Id<"foods">;
  name?: string;
  nameBn?: string;
  nameEn?: string;
  quantity?: number;
  unit?: string;
  portion?: string;
  grams: number;
  kcalLow: number;
  kcalHigh: number;
  sourceTag?: MealSourceTag | string;
};

function normalizeSlot(slot: InputSlot): MealSlot {
  if (slot === "snack") return "snacks";
  if (slot === "sehri") return "breakfast";
  if (slot === "iftar") return "dinner";
  return slot;
}

function normalizeSourceTag(tag?: string): MealSourceTag {
  if (
    tag === "measured" ||
    tag === "fctb" ||
    tag === "borrowed" ||
    tag === "user" ||
    tag === "estimated" ||
    tag === "estimated-recipe" ||
    tag === "ai-assisted"
  ) {
    return tag;
  }
  return "estimated";
}

function normalizeItem(item: MealItemInput) {
  const name = item.name ?? item.nameEn ?? item.nameBn ?? "Food item";
  return {
    foodId: item.foodId,
    nameBn: item.nameBn ?? name,
    nameEn: item.nameEn ?? name,
    quantity: item.quantity ?? 1,
    unit: item.unit ?? item.portion ?? "serving",
    grams: item.grams > 0 ? item.grams : 100,
    kcalLow: Math.max(0, item.kcalLow),
    kcalHigh: Math.max(item.kcalLow, item.kcalHigh),
    sourceTag: normalizeSourceTag(item.sourceTag),
  };
}

export async function listMealsByDate(date: string, key: string = "default") {
  const client = getConvexClient();
  return (await client.query(api.db.find, {
    table: "mealLogs",
    index: "by_profile_and_date",
    field: "profileKey",
    value: key,
    field2: "date",
    value2: date,
    order: "asc",
  })) as any[];
}

export async function listRecentMeals(limit: number = 10, key: string = "default") {
  const client = getConvexClient();
  return (await client.query(api.db.find, {
    table: "mealLogs",
    index: "by_profile_and_date",
    field: "profileKey",
    value: key,
    order: "desc",
    limit,
  })) as any[];
}

export async function getDaySummary(date: string, key: string = "default") {
  const meals = await listMealsByDate(date, key);
  let totalGrams = 0;
  let totalKcalLow = 0;
  let totalKcalHigh = 0;
  const items: any[] = [];

  for (const meal of meals) {
    for (const item of meal.items || []) {
      totalGrams += item.grams || 0;
      totalKcalLow += item.kcalLow || 0;
      totalKcalHigh += item.kcalHigh || 0;
      items.push(item);
    }
  }

  const midpointKcal = Math.round((totalKcalLow + totalKcalHigh) / 2);

  const plate: Record<string, number> = { grains: 0, veg: 0, protein: 0, other: 0 };
  let protein = 0;
  let carb = 0;
  let fat = 0;
  for (const item of items) {
    const grp = plateGroupFor(item.nameEn || item.name || "");
    plate[grp] = (plate[grp] || 0) + (item.grams || 0);
    protein += (item.grams || 0) * 0.08;
    carb += (item.grams || 0) * 0.22;
    fat += (item.grams || 0) * 0.04;
  }

  const macro = {
    protein: Math.round(protein),
    carb: Math.round(carb),
    fat: Math.round(fat),
  };

  const bySlot = {
    breakfast: 0,
    lunch: 0,
    snacks: 0,
    dinner: 0,
  };
  for (const m of meals) {
    const slot = (m.slot || "lunch") as keyof typeof bySlot;
    if (bySlot[slot] !== undefined) {
      bySlot[slot] += 1;
    }
  }

  return {
    date,
    mealCount: meals.length,
    itemCount: items.length,
    totalGrams: Math.round(totalGrams),
    totalKcalLow: Math.round(totalKcalLow),
    totalKcalHigh: Math.round(totalKcalHigh),
    kcalLow: Math.round(totalKcalLow),
    kcalHigh: Math.round(totalKcalHigh),
    midpointKcal,
    bySlot,
    plate: {
      grains: plate.grains || 0,
      veg: plate.veg || 0,
      protein: plate.protein || 0,
      other: plate.other || 0,
    },
    macro,
    meals,
  };
}

export async function createMeal(args: {
  key?: string;
  date: string;
  slot: InputSlot;
  items: MealItemInput[];
  method?: "text" | "voice" | "photo" | "preset";
  time?: string;
}) {
  const client = getConvexClient();
  const key = args.key ?? "default";
  const now = Date.now();
  const doc = {
    profileKey: key,
    date: args.date,
    slot: normalizeSlot(args.slot),
    items: args.items.map(normalizeItem),
    method: args.method ?? "text",
    time: args.time ?? new Date(now).toISOString().slice(11, 16),
  };
  return await client.mutation(api.db.insert, {
    table: "mealLogs",
    doc,
  });
}

export async function updateMeal(args: {
  key?: string;
  id: Id<"mealLogs"> | string;
  date?: string;
  slot?: InputSlot;
  items?: MealItemInput[];
}) {
  const client = getConvexClient();
  const patch: Record<string, any> = {};
  if (args.date) patch.date = args.date;
  if (args.slot) patch.slot = normalizeSlot(args.slot);
  if (args.items) patch.items = args.items.map(normalizeItem);

  return await client.mutation(api.db.patch, {
    id: args.id as string,
    doc: patch,
  });
}

export async function removeMeal(id: Id<"mealLogs"> | string, key: string = "default") {
  const client = getConvexClient();
  return await client.mutation(api.db.remove, { id: id as string });
}

export async function copyMeal(args: {
  key?: string;
  sourceId?: Id<"mealLogs"> | string;
  sourceMealId?: Id<"mealLogs"> | string;
  targetDate: string;
  targetSlot?: InputSlot;
}) {
  const sourceId = args.sourceId ?? args.sourceMealId;
  if (!sourceId) {
    throw new Error("sourceId or sourceMealId is required");
  }
  const client = getConvexClient();
  const existing = (await client.query(api.db.get, { id: sourceId as string })) as any;
  if (!existing) {
    throw new Error("Source meal not found");
  }

  const key = args.key ?? "default";
  const doc = {
    profileKey: key,
    date: args.targetDate,
    slot: args.targetSlot ? normalizeSlot(args.targetSlot) : existing.slot,
    items: existing.items,
    method: "preset",
    time: existing.time,
  };

  return await client.mutation(api.db.insert, {
    table: "mealLogs",
    doc,
  });
}
