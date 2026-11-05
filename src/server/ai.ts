"use server";

import { FOOD_SEED } from "../lib/foods/seed";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

async function callGroq(
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  jsonMode: boolean = false,
) {
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    throw new Error("GROQ_API_KEY is not configured on the Next.js backend");
  }

  const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.1,
      max_tokens: 600,
      ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Groq API error (${res.status}): ${errorText.slice(0, 300)}`);
  }

  const data = (await res.json()) as any;
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty response from Groq");
  return content;
}

export async function parseMealText(
  text: string,
  candidates?: Array<{
    id: string;
    nameBn: string;
    nameEn: string;
    aliases: string[];
  }>,
) {
  const cands =
    candidates && candidates.length > 0
      ? candidates.slice(0, 25)
      : FOOD_SEED.slice(0, 25).map((f, i) => ({
          id: `seed_${i}`,
          nameBn: f.nameBn,
          nameEn: f.nameEn,
          aliases: f.aliases,
        }));

  const allowedIds = new Set(cands.map((c) => c.id));
  const list = cands
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
    const raw = await callGroq(
      [
        { role: "system", content: system },
        { role: "user", content: `Candidates:\n${list}\n\nMeal line: ${text}` },
      ],
      true,
    );

    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);
    const rawPicks = Array.isArray(parsed.picks) ? parsed.picks : [];

    const picks = rawPicks.filter(
      (p: any) =>
        typeof p?.id === "string" &&
        allowedIds.has(p.id) &&
        typeof p.qty === "number" &&
        p.qty > 0 &&
        typeof p.unit === "string",
    );

    return { picks, notes: parsed.notes };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { error: `parse failed: ${message}` };
  }
}

export async function analyzeMealPhoto(
  imageBase64: string,
  candidates?: Array<{
    id: string;
    nameBn: string;
    nameEn: string;
  }>,
  platePreset?: string,
) {
  const cands =
    candidates && candidates.length > 0
      ? candidates.slice(0, 100)
      : FOOD_SEED.slice(0, 100).map((f, i) => ({
          id: `seed_${i}`,
          nameBn: f.nameBn,
          nameEn: f.nameEn,
        }));

  const list = cands.map((c) => `${c.id}|${c.nameEn}`).join("\n");

  const system = `Identify foods in the meal photo. Return ONLY JSON: { "items": [{ "foodId": string, "portionClass": "small"|"medium"|"large", "confidence": number }] }
Rules:
- foodId must be exactly the id part copied from Candidates.
- portionClass: small ≈ side, medium ≈ normal serving, large ≈ heaping.
- Plate preset: ${platePreset ?? "standard"}.`;

  try {
    const key = process.env.GROQ_API_KEY;
    if (!key) throw new Error("GROQ_API_KEY is not configured");

    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, "");
    const visionModel = process.env.GROQ_VISION_MODEL || "llama-3.2-11b-vision-preview";

    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: visionModel,
        messages: [
          { role: "system", content: system },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Candidates:\n${list}\n\nIdentify foods in this meal photo:`,
              },
              {
                type: "image_url",
                image_url: { url: `data:image/jpeg;base64,${cleanBase64}` },
              },
            ],
          },
        ],
        temperature: 0.1,
        max_tokens: 400,
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return { error: `Photo analysis failed: ${err.slice(0, 200)}` };
    }

    const data = (await res.json()) as any;
    const content = data.choices?.[0]?.message?.content;
    const parsed = JSON.parse(content || "{}");
    return { items: parsed.items || [] };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { error: `Photo analysis error: ${message}` };
  }
}
