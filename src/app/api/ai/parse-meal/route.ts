import { NextResponse } from "next/server";
import { parseMealText } from "@/server/ai";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const text = typeof body?.text === "string" ? body.text : "";
    if (!text.trim()) {
      return NextResponse.json({ error: "text is required" }, { status: 400 });
    }
    const result = await parseMealText(text);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to parse meal text";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

