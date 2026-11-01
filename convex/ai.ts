"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

async function groqChat(
  messages: { role: "system" | "user" | "assistant"; content: string }[],
  opts: { temperature?: number; maxTokens?: number; jsonMode?: boolean } = {},
): Promise<string> {
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    throw new Error("GROQ_API_KEY is not set on the Convex deployment");
  }
  const model = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.maxTokens ?? 1024,
      ...(opts.jsonMode ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Groq API ${res.status}: ${body.slice(0, 400)}`);
  }
  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("Groq API returned an empty response");
  return text;
}

/**
 * Deshi Health coach chat (W2 scaffold).
 * Privacy: never send age, weight, name or medical conditions to the LLM.
 * Numbers come from the deterministic engine / tool results only.
 */
export const chat = action({
  args: {
    message: v.string(),
    /** Safe, coarse context only — e.g. { mode: "normal", goal: "gentle-change" } */
    safeContext: v.optional(
      v.object({
        mode: v.union(
          v.literal("normal"),
          v.literal("restricted"),
          v.literal("doctor-first"),
        ),
        goal: v.optional(
          v.union(
            v.literal("maintain"),
            v.literal("gentle-change"),
            v.literal("build-strength"),
          ),
        ),
        lang: v.optional(v.string()),
      }),
    ),
  },
  returns: v.object({
    response: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (_ctx, args) => {
    const mode = args.safeContext?.mode ?? "normal";
    const goal = args.safeContext?.goal ?? "maintain";
    const system = `You are Deshi Health Companion's nutrition coach for Bangladesh.
Rules:
- Be warm, practical, shame-free. Never say "cheat day", "burn off", or "bad food".
- Ground answers in Bangladeshi foods (bhat, dal, mach, dim, ruti, khichuri).
- If safetyMode is doctor-first or restricted: no calorie targets, deficits, or exercise compensation; suggest talking to a doctor or registered dietitian.
- Never invent precise calorie numbers. If you must mention numbers, keep them approximate and clearly labelled as rough.
- Not a medical device. No diagnosis, no medication advice.
- Answer in the user's language (Bangla, English, or Banglish).
Current mode: ${mode}. Goal category: ${goal}.`;

    try {
      const response = await groqChat([
        { role: "system", content: system },
        { role: "user", content: args.message },
      ]);
      return { response };
    } catch (error) {
      console.error("Coach action error:", error);
      const message = error instanceof Error ? error.message : String(error);
      return {
        error: message.includes("401")
          ? "Groq rejected the API key (401). Set a valid key: `bunx convex env set GROQ_API_KEY=<key>`."
          : `AI request failed: ${message.slice(0, 300)}`,
      };
    }
  },
});

/**
 * Meal-line parser scaffold (W2): LLM picks from top candidates; code computes.
 * Input candidates come from the client food search — LLM never invents foods.
 */
export const parseMeal = action({
  args: {
    line: v.string(),
    candidates: v.array(
      v.object({
        id: v.string(),
        nameBn: v.string(),
        nameEn: v.string(),
        aliases: v.array(v.string()),
      }),
    ),
  },
  returns: v.object({
    picks: v.optional(
      v.array(
        v.object({
          id: v.string(),
          qty: v.number(),
          unit: v.string(),
        }),
      ),
    ),
    notes: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (_ctx, args) => {
    const line = args.line.trim();
    if (!line) return { error: "Meal line is empty" };
    if (line.length > 500) return { error: "Meal line is too long" };
    if (args.candidates.length === 0) {
      return { error: "No candidates provided" };
    }
    if (args.candidates.length > 25) {
      return { error: "Too many candidates" };
    }
    const allowedIds = new Set(args.candidates.map((candidate) => candidate.id));
    const list = args.candidates
      .map(
        (c, i) =>
          `${i}: id=${c.id} bn=${c.nameBn} en=${c.nameEn} aliases=${c.aliases.join("/")}`,
      )
      .join("\n");
    const system = `Pick foods from the candidate list that match the user's meal line.
Return ONLY JSON: { "picks": [{ "id": string, "qty": number, "unit": string }], "notes"?: string }
Rules:
- Never invent an id: copy it exactly from Candidates.
- Extract quantities and household units only from the meal line.
- If quantity is absent use qty=1; if unit is absent use unit="default".
- Prefer Bangla/Banglish alias matches. Do not calculate calories or grams.`;

    try {
      const text = await groqChat(
        [
          { role: "system", content: system },
          {
            role: "user",
            content: `Candidates:\n${list}\n\nMeal line: ${line}`,
          },
        ],
        { temperature: 0.1, maxTokens: 400, jsonMode: true },
      );
      const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(cleaned) as {
        picks?: { id: string; qty: number; unit: string }[];
        notes?: string;
      };
      const picks = (Array.isArray(parsed.picks) ? parsed.picks : []).flatMap((pick) => {
        if (
          typeof pick?.id !== "string" ||
          !allowedIds.has(pick.id) ||
          typeof pick.qty !== "number" ||
          !Number.isFinite(pick.qty) ||
          pick.qty <= 0 ||
          pick.qty > 20 ||
          typeof pick.unit !== "string"
        ) {
          return [];
        }
        const unit = pick.unit.trim().slice(0, 40) || "default";
        return [{ id: pick.id, qty: pick.qty, unit }];
      });
      if (picks.length === 0) return { error: "No valid candidate picks" };
      const notes = typeof parsed.notes === "string" ? parsed.notes.slice(0, 200) : undefined;
      return { picks, notes };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { error: `parse failed: ${message.slice(0, 200)}` };
    }
  },
});
