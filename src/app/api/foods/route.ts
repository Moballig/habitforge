import { NextResponse } from "next/server";
import { searchFoods, countFoods, getFoodById } from "@/server/foods";
import type { Id } from "../../../../convex/_generated/dataModel";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const id = searchParams.get("id") as Id<"foods"> | null;
  const isCount = searchParams.get("count") === "true";

  try {
    if (isCount) {
      const total = await countFoods();
      return NextResponse.json({ total });
    }
    if (id) {
      const food = await getFoodById(id);
      return NextResponse.json(food);
    }
    const limit = Number(searchParams.get("limit") || 20);
    const results = await searchFoods(q, limit);
    return NextResponse.json(results);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to search foods";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

