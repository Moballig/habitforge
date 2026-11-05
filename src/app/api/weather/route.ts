import { NextResponse } from "next/server";
import { getWeather, refreshWeather } from "@/server/weather";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const region = searchParams.get("region") ?? undefined;

  try {
    const data = await getWeather(region);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to query weather";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const region = body?.region ?? undefined;
    const result = await refreshWeather(region);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to refresh weather";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

