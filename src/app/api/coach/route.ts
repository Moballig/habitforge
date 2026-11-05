import { NextResponse } from "next/server";
import { chatCoach, searchRag, rewriteCoachQuery } from "@/server/coach";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = body.action ?? "chat";

    if (action === "ragSearch") {
      const result = await searchRag(body);
      return NextResponse.json(result);
    }
    if (action === "rewriteQuery" || action === "rewrite") {
      const result = await rewriteCoachQuery(body);
      return NextResponse.json(result);
    }

    const reply = await chatCoach(body);
    return NextResponse.json(reply);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to process coach request";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

