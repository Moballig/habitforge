/** Convert a user's fraction of a shared pot into grams. */
export function sharedPotGrams(
  totalPotGrams: number,
  shareNumerator: number,
  shareDenominator: number,
): number {
  if (
    !Number.isFinite(totalPotGrams) ||
    !Number.isFinite(shareNumerator) ||
    !Number.isFinite(shareDenominator) ||
    totalPotGrams <= 0 ||
    shareNumerator <= 0 ||
    shareDenominator <= 0 ||
    shareNumerator > shareDenominator
  ) {
    throw new RangeError("Invalid shared-pot fraction");
  }
  return Math.round(totalPotGrams * (shareNumerator / shareDenominator));
}

export type PortionClass = "small" | "medium" | "large";

const FALLBACK_GRAMS = {
  // cooked foods: a bit more volume per 100 g than raw
  cooked: { small: 75, medium: 150, large: 250 },
  raw: { small: 50, medium: 100, large: 150 },
} as const satisfies Record<string, Record<PortionClass, number>>;

/**
 * Map a vision model's relative portion class to grams using the food's
 * household-measure ladder (sorted ascending; small = lightest measure,
 * large = heaviest, medium = middle or average of the two middle values).
 * Foods without measures fall back to cooked/raw defaults.
 */
export function portionClassToGrams(
  food: { measures: { label: string; grams: number }[]; isCooked: boolean },
  portionClass: PortionClass,
): { grams: number; label: string } {
  if (portionClass !== "small" && portionClass !== "medium" && portionClass !== "large") {
    throw new RangeError(`Unknown portion class: ${String(portionClass)}`);
  }
  const usable = food.measures.filter(
    (m) => Number.isFinite(m.grams) && m.grams > 0 && m.label.length > 0,
  );
  if (usable.length === 0) {
    const fallback = food.isCooked ? FALLBACK_GRAMS.cooked : FALLBACK_GRAMS.raw;
    return { grams: fallback[portionClass], label: portionClass };
  }
  const sorted = [...usable].sort((a, b) => a.grams - b.grams);
  if (portionClass === "small") {
    return { grams: Math.round(sorted[0].grams), label: sorted[0].label };
  }
  if (portionClass === "large") {
    const last = sorted[sorted.length - 1];
    return { grams: Math.round(last.grams), label: last.label };
  }
  // medium
  const mid = (sorted.length - 1) / 2;
  if (Number.isInteger(mid)) {
    const m = sorted[mid];
    return { grams: Math.round(m.grams), label: m.label };
  }
  const low = sorted[Math.floor(mid)].grams;
  const high = sorted[Math.ceil(mid)].grams;
  return { grams: Math.round((low + high) / 2), label: "medium" };
}
