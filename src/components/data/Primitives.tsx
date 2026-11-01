import type { ReactNode } from "react";
import { useI18n } from "@/lib/i18n";
import type { SourceTag as SourceTagType } from "@/lib/types";

export function Num({
  value,
  unit,
  className = "",
}: {
  value: string | number;
  unit?: string;
  className?: string;
}) {
  return (
    <span className={`font-num tabular ${className}`}>
      {value}
      {unit ? <span className="ml-1 text-[0.7em] font-semibold opacity-60">{unit}</span> : null}
    </span>
  );
}

export function Range({
  low,
  high,
  unit = "kcal",
  prefix,
  className = "",
}: {
  low: number;
  high: number;
  unit?: string;
  prefix?: string;
  className?: string;
}) {
  const { lang } = useI18n();
  const fmt = (n: number) =>
    new Intl.NumberFormat(lang === "bn" ? "bn-BD" : "en-US", { maximumFractionDigits: 0 }).format(n);
  return (
    <span className={`font-num tabular ${className}`}>
      {prefix ? `${prefix} ` : ""}
      {fmt(low)}–{fmt(high)} {unit}
    </span>
  );
}

const TAG_STYLES: Record<SourceTagType, string> = {
  measured: "bg-mint text-mint-ink",
  fctb: "bg-sky text-sky-ink",
  borrowed: "bg-lilac text-lilac-ink",
  user: "bg-peach text-peach-ink",
  estimated: "bg-surface-soft text-ink/70",
  "estimated-recipe": "bg-peach text-peach-ink",
  "ai-assisted": "bg-lilac text-lilac-ink",
};

const TAG_LABELS: Record<SourceTagType, string> = {
  measured: "Measured",
  fctb: "FCTB",
  borrowed: "Borrowed",
  user: "You entered",
  estimated: "Estimated",
  "estimated-recipe": "Recipe estimate",
  "ai-assisted": "AI-assisted",
};

export function SourceTag({ tag }: { tag: SourceTagType }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${TAG_STYLES[tag]}`}
    >
      {TAG_LABELS[tag]}
    </span>
  );
}

export function ToolNumber({ children }: { children: ReactNode }) {
  return (
    <span className="font-num tabular rounded bg-lilac px-1.5 py-0.5 text-[13px] font-bold text-lilac-ink">
      {children}
    </span>
  );
}

export function Chip({
  children,
  selected,
  onClick,
  tone = "default",
}: {
  children: ReactNode;
  selected?: boolean;
  onClick?: () => void;
  tone?: "default" | "mint" | "sky" | "lilac" | "peach";
}) {
  const tones = {
    default: selected ? "bg-violet text-white" : "bg-surface-soft text-ink/70",
    mint: "bg-mint text-mint-ink",
    sky: "bg-sky text-sky-ink",
    lilac: "bg-lilac text-lilac-ink",
    peach: "bg-peach text-peach-ink",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={onClick ? selected : undefined}
      className={`inline-flex min-h-9 items-center rounded-full px-3.5 text-[13px] font-semibold transition ${tones[tone]}`}
    >
      {children}
    </button>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <h2 className="section-dot mb-3 text-[15px] font-bold">{children}</h2>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-card bg-surface-soft px-6 py-12 text-center">
      <p className="text-base font-bold">{title}</p>
      {body && <p className="mt-1 max-w-xs text-sm text-ink/60">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Skeleton({ className = "h-24" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`animate-pulse rounded-card bg-surface-soft ${className}`}
    />
  );
}
