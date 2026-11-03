/** Client helpers for the local multilingual embedding endpoint + RAG search. */

export type RagHit = {
  id: string;
  text: string;
  source: string;
  sourceTag:
    | "guideline"
    | "food-table"
    | "recipe"
    | "research"
    | "indigenous"
    | "price"
    | "faostat"
    | "market";
  section?: string;
  page?: number;
  lang: "en" | "bn" | "mixed";
  url?: string;
  score: number;
};

/** Route only explicit corpus intents; everything else keeps hybrid retrieval. */
export function inferRagSourceTag(query: string): RagHit["sourceTag"] | undefined {
  const text = query.toLocaleLowerCase();
  if (
    text.includes("indigenous") ||
    /দেশি\s+(?:শস্য|ডাল|খাদ্য)/u.test(text)
  ) {
    return "indigenous";
  }
  if (
    /\b(?:healthy|balanced)\s+(?:meal|plate)\b/u.test(text) ||
    /সুষম\s+(?:খাবার|থালা|প্লেট)/u.test(text)
  ) {
    return "guideline";
  }
  return undefined;
}

/**
 * Embeds a query with the local multilingual model (`/api/embed`).
 * Returns undefined when the model is unavailable, so callers can fall back
 * to keyword-only retrieval.
 */
export async function embedQuery(query: string): Promise<number[] | undefined> {
  const text = query.trim();
  if (text.length < 2) return undefined;
  try {
    const response = await fetch("/api/embed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: text }),
    });
    if (!response.ok) return undefined;
    const data = (await response.json()) as { embedding?: unknown };
    if (!Array.isArray(data.embedding) || data.embedding.length !== 384) {
      return undefined;
    }
    return data.embedding as number[];
  } catch {
    return undefined;
  }
}

/** Short citation label for a retrieved chunk. */
export function citationLabel(hit: RagHit): string {
  const section = hit.section ? ` — ${hit.section}` : "";
  const page = hit.page ? ` p.${hit.page}` : "";
  return `${hit.source}${section}${page}`;
}
