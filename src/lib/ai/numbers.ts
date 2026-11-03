/**
 * Numeric traceability validator (Wave 5 gate, FR-F-02).
 *
 * Every number in a coach reply must literally appear in a source text —
 * the retrieved excerpts (incl. their labels/section/page) and/or the
 * user's own message. Returns the normalized tokens that could NOT be
 * traced (empty array = pass).
 */

const BANGLA_DIGITS = "০১২৩৪৫৬৭৮৯";

function normalize(text: string): string {
  return text
    .replace(/[০-৯]/g, (d) => String(BANGLA_DIGITS.indexOf(d)))
    .replace(/,/g, "");
}

/** Drop list markers and citation chips so they don't read as health numbers. */
function stripNoise(answer: string): string {
  return answer
    .replace(/^\s*(?:[*-]\s+|\d+[.)]\s+)/gm, " ")
    .replace(/\[\d+\]/g, " ");
}

/** Shortcut: digit-boundary matching instead of a real tokenizer — "B12"/"omega-3" pass via boundaries; upgrade if the 20Q gate shows false positives/negatives. */
function mentions(haystack: string, token: string): boolean {
  const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?<![\\d.])${escaped}(?!\\d|\\.\\d)`).test(haystack);
}

export function unsourcedNumbers(answer: string, sources: string[]): string[] {
  const sourceText = normalize(sources.join("\n"));
  const text = normalize(stripNoise(answer));
  const found: string[] = [];
  for (const match of text.matchAll(/\d+(?:\.\d+)?/g)) {
    const token = match[0];
    if (!mentions(sourceText, token) && !found.includes(token)) {
      found.push(token);
    }
  }
  return found;
}
