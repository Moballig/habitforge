// Language-aware number formatting. Never compute health values here — only format.

export type Lang = "en" | "bn";

export function formatNumber(n: number, lang: Lang = "en"): string {
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat(lang === "bn" ? "bn-BD" : "en-US", {
    maximumFractionDigits: Number.isInteger(n) ? 0 : 1,
  }).format(n);
}

export function formatKcal(n: number, lang: Lang = "en"): string {
  return formatNumber(Math.round(n), lang);
}

export function formatRange(low: number, high: number, lang: Lang = "en", unit = ""): string {
  const u = unit ? ` ${unit}` : "";
  return `${formatNumber(low, lang)}–${formatNumber(high, lang)}${u}`;
}

export function formatPercent(p: number, lang: Lang = "en"): string {
  return `${formatNumber(Math.round(p), lang)}%`;
}

export function formatDate(d: Date | string, lang: Lang = "en"): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat(lang === "bn" ? "bn-BD" : "en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function formatShortDate(d: Date | string, lang: Lang = "en"): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat(lang === "bn" ? "bn-BD" : "en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

export function formatDayName(d: Date | string, lang: Lang = "en"): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat(lang === "bn" ? "bn-BD" : "en-US", { weekday: "short" }).format(date);
}

export function formatClock(totalMin: number, lang: Lang = "en"): string {
  const m = Math.max(0, Math.round(totalMin));
  const h = Math.floor(m / 60);
  const min = m % 60;
  const mm = formatNumber(min, lang);
  return h > 0 ? `${formatNumber(h, lang)}:${min < 10 ? "0" : ""}${mm}` : `${mm}:00`;
}
