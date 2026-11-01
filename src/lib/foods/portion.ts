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
