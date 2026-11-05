import { NextResponse } from "next/server";
import {
  listMealsByDate,
  listRecentMeals,
  getDaySummary,
  createMeal,
  updateMeal,
  removeMeal,
  copyMeal,
} from "@/server/meals";
import type { Id } from "../../../../convex/_generated/dataModel";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key") ?? "default";
  const date = searchParams.get("date");
  const isRecent = searchParams.get("recent") === "true";
  const isSummary = searchParams.get("summary") === "true";

  try {
    if (isRecent) {
      const limit = Number(searchParams.get("limit") || 10);
      const meals = await listRecentMeals(limit, key);
      return NextResponse.json(meals);
    }
    if (isSummary) {
      if (!date) return NextResponse.json({ error: "date is required" }, { status: 400 });
      const summary = await getDaySummary(date, key);
      return NextResponse.json(summary);
    }
    if (!date) return NextResponse.json({ error: "date is required" }, { status: 400 });
    const meals = await listMealsByDate(date, key);
    return NextResponse.json(meals);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to query meals";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.action === "copy") {
      const result = await copyMeal(body);
      return NextResponse.json(result);
    }
    const id = await createMeal(body);
    return NextResponse.json({ id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create meal";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const result = await updateMeal(body);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update meal";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id") as Id<"mealLogs"> | null;
  const key = searchParams.get("key") ?? "default";

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  try {
    const result = await removeMeal(id, key);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete meal";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

