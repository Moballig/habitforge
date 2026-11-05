import { NextResponse } from "next/server";
import { getWeightTrend, addWeighIn, removeWeighIn } from "@/server/weights";
import type { Id } from "../../../../convex/_generated/dataModel";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key") ?? "default";
  const today = searchParams.get("today");

  if (!today) {
    return NextResponse.json({ error: "today (YYYY-MM-DD) is required" }, { status: 400 });
  }

  try {
    const data = await getWeightTrend(today, key);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to query weight trend";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const id = await addWeighIn(body);
    return NextResponse.json({ id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to log weight";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id") as Id<"weighIns"> | null;
  const key = searchParams.get("key") ?? "default";

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  try {
    const result = await removeWeighIn(id, key);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete weigh-in";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

