"use server";

import { getConvexClient, api } from "./convex";
import { unsourcedNumbers } from "../lib/ai/numbers";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

export async function chatCoach(args: {
  message: string;
  lang?: "en" | "bn" | "mixed";
  context?: Array<{
    text: string;
    source: string;
    section?: string;
    page?: number;
  }> | string;
  safeContext?: {
    mode: "normal" | "restricted" | "doctor-first";
    goal?: "maintain" | "gentle-change" | "build-strength";
    lang?: string;
  };
  todayContext?: {
    safetyMode?: "normal" | "restricted" | "doctor-first";
    eatenKcal?: number;
    budgetKcal?: number;
    remainingKcal?: number;
    activityMin?: number;
  };
}) {
  const mode = args.safeContext?.mode ?? args.todayContext?.safetyMode ?? "normal";
  const goal = args.safeContext?.goal ?? "maintain";

  const contextItems = Array.isArray(args.context)
    ? args.context
    : typeof args.context === "string" && args.context.trim()
      ? [{ text: args.context, source: "user-context" }]
      : [];

  const excerpts = contextItems.slice(0, 6).map((item, index) => {
    const label = `${item.source}${item.section ? ` — ${item.section}` : ""}`;
    return `[${index + 1}] ${label}\n${item.text.slice(0, 700)}`;
  });

  const contextBlock =
    excerpts.length > 0
      ? `\n\nReference excerpts:\n${excerpts.join("\n\n")}\nRules for excerpts: use only when relevant, cite inline [1]. Never quote numbers not in excerpts.`
      : "";

  const system = `You are Deshi Health Companion's nutrition coach for Bangladesh.
Rules:
- Warm, practical, shame-free. Never say "cheat day" or "bad food".
- Ground answers in Bangladeshi foods (bhat, dal, mach, dim, ruti).
- Safety mode: ${mode}. Goal: ${goal}.
- If safety mode is doctor-first or restricted: no calorie deficits, advise consulting a physician.
- Numbers: only cite numbers literally appearing in reference excerpts or the user's message.
- Answer in the user's language (Bangla, English, or Banglish).${contextBlock}`;

  const key = process.env.GROQ_API_KEY;
  if (!key) {
    return {
      response:
        "আমি দেশি হেলথ কম্প্যানিয়ন। আপনার পুষ্টি ও খাদ্যাভ্যাস সম্পর্কে কোনো প্রশ্ন থাকলে জানান। (AI key not set)",
    };
  }

  try {
    const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: args.message },
        ],
        temperature: 0.3,
        max_tokens: 800,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return { error: `Coach error: ${err.slice(0, 200)}` };
    }

    const data = (await res.json()) as any;
    const text = data.choices?.[0]?.message?.content || "";

    // Guardrail: check unsourced numbers
    const sources = [args.message, ...contextItems.map((c) => c.text)];
    const violators = unsourcedNumbers(text, sources);
    if (violators.length > 0 && mode !== "normal") {
      return {
        response:
          "স্বাস্থ্য সুরক্ষার্থে নির্দিষ্ট সংখ্যামূলক পরিমাপের পরিবর্তে সুষম খাবার ও চিকিৎসকের পরামর্শ নেওয়াই শ্রেয়।",
      };
    }

    return { response: text };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { error: `Coach service unavailable: ${message}` };
  }
}

export async function searchRag(args: {
  query: string;
  topK?: number;
  limit?: number;
  sourceTag?: string;
  lang?: "en" | "bn" | "mixed";
  queryEmbedding?: number[];
}) {
  const client = getConvexClient();
  const limit = args.limit ?? args.topK ?? 8;

  try {
    const chunks = (await client.query(api.db.find, {
      table: "ragChunks",
      limit: Math.min(limit * 2, 30),
    })) as any[];

    const q = args.query.toLowerCase().trim();
    const filtered = q
      ? chunks.filter((c) => c.text?.toLowerCase().includes(q) || c.source?.toLowerCase().includes(q))
      : chunks;

    return filtered.slice(0, limit).map((c, i) => ({
      id: c._id,
      text: c.text,
      source: c.source,
      sourceTag: c.sourceTag,
      section: c.section,
      page: c.page,
      lang: c.lang,
      url: c.url,
      score: 0.8 - i * 0.05,
    }));
  } catch {
    return [];
  }
}

export async function rewriteCoachQuery(args: { query: string; lang?: "en" | "bn" }) {
  return { query: args.query };
}
