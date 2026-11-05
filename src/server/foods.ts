"use server";

import { getConvexClient, api } from "./convex";
import { FOOD_SEED } from "../lib/foods/seed";

export async function searchFoods(query: string, limit: number = 20) {
  const client = getConvexClient();
  try {
    const hits = (await client.query(api.db.searchFoods, { q: query, limit })) as any[];
    if (hits && hits.length > 0) return hits;
  } catch {
    // Fall back to offline seed
  }

  const q = query.toLowerCase().trim();
  if (!q) return FOOD_SEED.slice(0, limit);

  return FOOD_SEED.filter((f) =>
    f.nameEn.toLowerCase().includes(q) ||
    f.nameBn.includes(q) ||
    f.aliases.some((a) => a.toLowerCase().includes(q)),
  ).slice(0, limit);
}

export async function countFoods() {
  const client = getConvexClient();
  try {
    const count = await client.query(api.db.count, { table: "foods" });
    if (count > 0) return count;
  } catch {
    // Fall back to seed length
  }
  return FOOD_SEED.length;
}

export async function getFoodById(id: string) {
  const client = getConvexClient();
  return await client.query(api.db.get, { id });
}
