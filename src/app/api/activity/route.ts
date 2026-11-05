import { NextResponse } from "next/server";
import {
  listWeekActivity,
  createActivity,
  removeActivity,
} from "@/server/activity";
import type { Id } from "../../../../convex/_generated/dataModel";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key") ?? "default";
  const today = searchParams.get("today");

  if (!today) {
    return NextResponse.json({ error: "today (YYYY-MM-DD) is required" }, { status: 400 });
  }

  try {
    const data = await listWeekActivity(today, key);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to query activity";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const id = await createActivity(body);
    return NextResponse.json({ id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create activity";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id") as Id<"activityLogs"> | null;
  const key = searchParams.get("key") ?? "default";

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  try {
    const result = await removeActivity(id, key);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete activity";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

