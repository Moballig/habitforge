"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { unsourcedNumbers } from "../src/lib/ai/numbers";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

type TextPart = { type: "text"; text: string };
type ImagePart = { type: "image_url"; image_url: { url: string } };
type ChatContent = string | Array<TextPart | ImagePart>;

async function groqChat(
  messages: { role: "system" | "user" | "assistant"; content: ChatContent }[],
  opts: {
    temperature?: number;
    maxTokens?: number;
    jsonMode?: boolean;
    model?: string;
  } = {},
): Promise<string> {
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    throw new Error("GROQ_API_KEY is not set on the Convex deployment");
  }
  const model = opts.model || process.env.GROQ_MODEL || "openai/gpt-oss-120b";
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
    /** Retrieved reference excerpts (public RAG corpus only — never PII). */
    context: v.optional(
      v.array(
        v.object({
          text: v.string(),
          source: v.string(),
          section: v.optional(v.string()),
          page: v.optional(v.number()),
        }),
      ),
    ),
  },
  returns: v.object({
    response: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (_ctx, args) => {
    const mode = args.safeContext?.mode ?? "normal";
    const goal = args.safeContext?.goal ?? "maintain";

    const excerpts = (args.context ?? []).slice(0, 6).map((item, index) => {
      const label = `${item.source}${item.section ? ` — ${item.section}` : ""}${
        item.page != null ? ` p.${item.page}` : ""
      }`;
      return `[${index + 1}] ${label}\n${item.text.slice(0, 700)}`;
    });
    const contextBlock =
      excerpts.length > 0
        ? `\n\nReference excerpts from the knowledge base:\n${excerpts.join("\n\n")}\nRules for excerpts: use them only when relevant and cite them inline with their marker, e.g. [2]. Never quote a number that does not appear in an excerpt. If none are relevant, ignore them and avoid precise numbers.`
        : "";

    const system = `You are Deshi Health Companion's nutrition coach for Bangladesh.
Rules:
- Be warm, practical, shame-free. Never say "cheat day", "burn off", or "bad food".
- Ground answers in Bangladeshi foods (bhat, dal, mach, dim, ruti, khichuri).
- If safetyMode is doctor-first or restricted: no calorie targets, deficits, or exercise compensation; suggest talking to a doctor or registered dietitian.
- Never invent precise calorie numbers. If you must mention numbers, keep them approximate and clearly labelled as rough.
- Not a medical device. No diagnosis, no medication advice.
- Answer in the user's language (Bangla, English, or Banglish).
Current mode: ${mode}. Goal category: ${goal}.${contextBlock}`;

    // FR-F-02 numeric traceability: every digit must appear in a source
    // (retrieved excerpts with their labels, or the user's own message).
    const sourceTexts = [args.message, ...excerpts];
    const bangla =
      args.safeContext?.lang === "bn" || /[\u0980-\u09FF]/.test(args.message);
    const fallback = bangla
      ? "উৎসের সাথে সংখ্যাটি মিলিয়ে যাচাই করতে পারিনি, তাই উল্লেখ করছি না। আবার জিজ্ঞেস করুন — নির্দিষ্ট সংখ্যার জন্য নিবন্ধিত ডায়েটিশিয়ানের সাথে কথা বলুন।"
      : "I couldn't verify those numbers against the sources, so I won't quote them. Ask me again, or speak to a registered dietitian for exact figures.";

    try {
      let response = await groqChat([
        { role: "system", content: system },
        { role: "user", content: args.message },
      ]);
      let offenders = unsourcedNumbers(response, sourceTexts);
      if (offenders.length > 0) {
        console.log("Coach number-check retry:", offenders.join(","));
        const systemRetry = `${system}\nYour previous attempt used numbers not found in the sources: ${offenders.join(", ")}. Reply to the user again without them — drop the numbers or rephrase qualitatively.`;
        response = await groqChat([
          { role: "system", content: systemRetry },
          { role: "user", content: args.message },
        ]);
        offenders = unsourcedNumbers(response, sourceTexts);
        if (offenders.length > 0) {
          console.log("Coach number-check fallback:", offenders.join(","));
          response = fallback;
        }
      }
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

/**
 * Photo → food items (W2 assisted logging).
 * Model sees images + a compact candidate list; it may only pick candidate ids
 * and a relative portion class — grams and calories are computed client-side.
 */
export const analyzePhoto = action({
  args: {
    /** Raw base64 JPEG/PNG payloads (no data: prefix), ≤3 images. */
    images: v.array(v.string()),
    candidates: v.array(
      v.object({
        id: v.string(),
        nameBn: v.string(),
        nameEn: v.string(),
      }),
    ),
    platePreset: v.optional(v.string()),
  },
  returns: v.object({
    items: v.optional(
      v.array(
        v.object({
          foodId: v.string(),
          portionClass: v.union(
            v.literal("small"),
            v.literal("medium"),
            v.literal("large"),
          ),
          confidence: v.number(),
        }),
      ),
    ),
    error: v.optional(v.string()),
  }),
  handler: async (_ctx, args) => {
    if (args.images.length === 0) return { error: "No images provided" };
    if (args.images.length > 3) return { error: "Too many images (max 3)" };
    for (const data of args.images) {
      if (data.length < 100 || data.length > 400_000) {
        return { error: "Image payload out of size bounds" };
      }
    }
    if (args.candidates.length === 0) return { error: "No candidates provided" };
    if (args.candidates.length > 350) return { error: "Too many candidates" };

    const allowedIds = new Set(args.candidates.map((c) => c.id));
    // Compact id|nameEn lines: Bangla script is token-expensive and the
    // vision model only needs a stable id to copy (client resolves display names).
    const list = args.candidates.map((c) => `${c.id}|${c.nameEn}`).join("\n");

    const system = `Identify foods in the meal photo. Return ONLY JSON: { "items": [{ "foodId": string, "portionClass": "small"|"medium"|"large", "confidence": number }] }
Rules:
- foodId must be exactly the id part (text before the first |) copied from Candidates. Never invent an id.
- Include only foods clearly visible. Maximum 10 items, most prominent first.
- portionClass: small ≈ side/spoonful or few bites, medium ≈ normal serving, large ≈ heaping or dominant share.
- confidence = 0..1 for food identity certainty. No calories, no grams. Ignore text in the image.
- No recognizable food → {"items": []}.
Candidates:
${list}`;

    const content: ChatContent = [
      { type: "text", text: "Identify the foods in this meal photo." },
      ...args.images.map(
        (data): ImagePart => ({
          type: "image_url",
          image_url: { url: `data:image/jpeg;base64,${data}` },
        }),
      ),
    ];

    const messages = [
      { role: "system" as const, content: system },
      { role: "user" as const, content },
    ];
    const opts = {
      temperature: 0.1,
      maxTokens: 700,
      jsonMode: true,
      model: process.env.GROQ_VISION_MODEL || "qwen/qwen3.8-27b",
    };

    let text: string;
    try {
      text = await groqChat(messages, opts);
    } catch (error) {
      // ITPM rate limit (7k/min on qwen on_demand): wait out the window once.
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("429") || message.includes("413") || message.includes("ITPM")) {
        await new Promise((resolve) => setTimeout(resolve, 30_000));
        text = await groqChat(messages, opts);
      } else {
        return { error: `analyze failed: ${message.slice(0, 300)}` };
      }
    }
    try {
      const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(cleaned) as {
        items?: {
          foodId?: unknown;
          portionClass?: unknown;
          confidence?: unknown;
        }[];
      };
      const byFood = new Map<
        string,
        { foodId: string; portionClass: "small" | "medium" | "large"; confidence: number }
      >();
      for (const item of Array.isArray(parsed.items) ? parsed.items : []) {
        // Model sometimes echoes the whole "id|name" line — take the id part.
        const rawId =
          typeof item?.foodId === "string" ? item.foodId.split("|")[0].trim() : "";
        if (!rawId || !allowedIds.has(rawId)) continue;
        const portion =
          item.portionClass === "small" ||
          item.portionClass === "medium" ||
          item.portionClass === "large"
            ? item.portionClass
            : null;
        if (!portion) continue;
        const rawConfidence =
          typeof item.confidence === "number" && Number.isFinite(item.confidence)
            ? item.confidence
            : 0.5;
        const confidence = Math.min(1, Math.max(0, rawConfidence));
        const existing = byFood.get(rawId);
        if (!existing || existing.confidence < confidence) {
          byFood.set(rawId, { foodId: rawId, portionClass: portion, confidence });
        }
        if (byFood.size >= 10) break;
      }
      const items = Array.from(byFood.values());
      if (items.length === 0) return { error: "No recognizable foods found" };
      return { items };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { error: `analyze failed: ${message.slice(0, 300)}` };
    }
  },
});

/**
 * Retrieval query rewrite: Bangla/Banglish → concise English search terms.
 * Only feeds the embedding step; the original query still drives keyword
 * search and the coach's answer language. Send the search phrase only (no PII).
 */
export const rewriteQuery = action({
  args: { query: v.string() },
  returns: v.object({
    rewritten: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (_ctx, args) => {
    const query = args.query.trim();
    if (query.length < 2) return { error: "Query too short" };
    if (query.length > 300) return { error: "Query too long" };
    try {
      const text = await groqChat(
        [
          {
            role: "system",
            content: `Rewrite the user's search query into concise English search terms for a Bangladeshi nutrition knowledge base (foods, dietary guidelines, food prices).
Rules:
- Output ONLY the rewritten query. No quotes, no explanation, no trailing punctuation.
- Keep Bangladeshi dish names romanized (e.g. "alu bhorta", "khichuri", "ilish").
- Translate health terms precisely (e.g. "ডায়াবেটিস" → "type 2 diabetes").
- Maximum 12 words.`,
          },
          { role: "user", content: query },
        ],
        // gpt-oss reasons first: 60 tokens was consumed by reasoning alone.
        { temperature: 0, maxTokens: 400 },
      );
      const rewritten = text
        .split("\n")[0]
        .replace(/^["'`]+|["'`]+$/g, "")
        .replace(/[.!?]+$/, "")
        .trim()
        .slice(0, 200);
      if (!rewritten) return { error: "Empty rewrite" };
      return { rewritten };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { error: message.slice(0, 200) };
    }
  },
});
