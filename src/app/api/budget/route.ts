import { NextResponse } from "next/server";
import { getBudget, getWhatIf } from "@/server/budget";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key") ?? "default";
  const today = searchParams.get("today");
  const extraKcalParam = searchParams.get("extraKcal");

  if (!today) {
    return NextResponse.json({ error: "today (YYYY-MM-DD) is required" }, { status: 400 });
  }

  try {
    if (extraKcalParam !== null) {
      const extraKcal = Number(extraKcalParam);
      const data = await getWhatIf(today, extraKcal, key);
      return NextResponse.json(data);
    }
    const data = await getBudget(today, key);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to query budget";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

