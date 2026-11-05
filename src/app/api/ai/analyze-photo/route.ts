import { NextResponse } from "next/server";
import { analyzeMealPhoto } from "@/server/ai";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const imageBase64 = typeof body?.imageBase64 === "string" ? body.imageBase64 : "";
    if (!imageBase64) {
      return NextResponse.json({ error: "imageBase64 is required" }, { status: 400 });
    }
    const result = await analyzeMealPhoto(imageBase64);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to analyze photo";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

