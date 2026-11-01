"use client";

import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import { Sparkline } from "./Charts";

export function StatTile({
  icon: Icon,
  label,
  value,
  unit,
  spark,
  inset = true,
}: {
  icon?: ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: ReactNode;
  unit?: string;
  spark?: number[];
  inset?: boolean;
}) {
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-ink/50">{label}</p>
          <p className="mt-1 font-num text-xl font-extrabold tabular">
            {value}
            {unit && <span className="ml-1 text-xs font-semibold text-ink/50">{unit}</span>}
          </p>
        </div>
        {Icon && (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-tile bg-surface-soft text-violet">
            <Icon size={16} />
          </span>
        )}
      </div>
      {(spark || inset) && (
        <div className={`mt-3 flex h-10 items-end justify-between rounded-tile bg-surface-soft px-2 py-1.5`}>
          {spark ? <Sparkline data={spark} /> : <span />}
          {spark && (
            <span className="font-num text-[11px] font-bold text-ink/50 tabular">
              {spark[spark.length - 1]}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export function PastelTile({
  tone,
  icon: Icon,
  label,
  sublabel,
  onClick,
  as = "button",
}: {
  tone: "mint" | "sky" | "lilac" | "peach";
  icon: ComponentType<{ size?: number }>;
  label: string;
  sublabel?: string;
  onClick?: () => void;
  as?: "button" | "div";
}) {
  const tones = {
    mint: "bg-mint text-mint-ink",
    sky: "bg-sky text-sky-ink",
    lilac: "bg-lilac text-lilac-ink",
    peach: "bg-peach text-peach-ink",
  };
  const cls = `flex min-h-[88px] flex-col justify-between rounded-tile p-3 text-left ${tones[tone]} transition hover:brightness-95`;
  const inner = (
    <>
      <Icon size={20} />
      <div>
        <p className="text-[13px] font-bold leading-tight">{label}</p>
        {sublabel && <p className="mt-0.5 text-[11px] font-medium opacity-70">{sublabel}</p>}
      </div>
    </>
  );
  if (as === "div") return <div className={cls}>{inner}</div>;
  return (
    <button type="button" onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}

export function GoalCard({
  icon: Icon,
  title,
  subtitle,
  progress,
  daysLeft,
  href,
}: {
  icon: ComponentType<{ size?: number }>;
  title: string;
  subtitle?: string;
  progress: number; // 0–1
  daysLeft?: number;
  href?: string;
}) {
  const pct = Math.round(Math.min(Math.max(progress, 0), 1) * 100);
  const body = (
    <div className="card p-5">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-violet/10 text-violet">
        <Icon size={20} />
      </span>
      <p className="mt-3 text-[15px] font-bold">{title}</p>
      {subtitle && <p className="text-xs text-ink/50">{subtitle}</p>}
      <div className="mt-3 h-2 rounded-full bg-surface-soft">
        <div className="h-2 rounded-full bg-leaf" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="font-num text-xs font-bold tabular">{pct}%</span>
        {daysLeft != null && (
          <span className="rounded-full bg-peach px-2.5 py-0.5 text-[11px] font-bold text-peach-ink">
            {daysLeft} days left
          </span>
        )}
      </div>
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

export function HeroCard({
  title,
  period,
  onPeriod,
  chart,
  stats,
  children,
}: {
  title: string;
  period?: string;
  onPeriod?: () => void;
  chart?: ReactNode;
  stats?: { label: string; value: ReactNode }[];
  children?: ReactNode;
}) {
  return (
    <div
      className="overflow-hidden rounded-card p-5 text-white md:p-6"
      style={{ background: "var(--hero-grad)" }}
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-lg font-bold">{title}</h2>
        {period && onPeriod && (
          <button
            type="button"
            onClick={onPeriod}
            className="rounded-full bg-white/15 px-3.5 py-1.5 text-xs font-bold backdrop-blur"
          >
            {period} ▾
          </button>
        )}
      </div>
      {children}
      {chart}
      {stats && stats.length > 0 && (
        <div className="mt-4 grid grid-cols-3 divide-x divide-white/15 rounded-tile bg-white/10">
          {stats.map((s) => (
            <div key={s.label} className="px-3 py-3 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
                {s.label}
              </p>
              <p className="font-num mt-0.5 text-base font-extrabold tabular sm:text-lg">
                {s.value}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function TabBar({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: string; label: string }[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-border" role="tablist">
      {tabs.map((tab) => {
        const on = tab.id === active;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={on}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`min-h-11 whitespace-nowrap border-b-2 px-4 text-sm font-semibold transition ${
              on
                ? "border-ink text-ink"
                : "border-transparent text-ink/45 hover:text-ink/70"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export function CitationChip({
  section,
  page,
  onClick,
}: {
  section: string;
  page?: number;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full bg-sky px-3 py-1 text-[11px] font-bold text-sky-ink"
    >
      📄 {section}
      {page != null && <span className="opacity-60">p.{page}</span>}
    </button>
  );
}

export function Slider({
  label,
  leftLabel,
  rightLabel,
  value,
  min = 0,
  max = 100,
  step = 5,
  onChange,
  disabled,
}: {
  label: string;
  leftLabel: string;
  rightLabel: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className={disabled ? "opacity-40" : ""}>
      <div className="flex items-center justify-between text-xs font-semibold text-ink/60">
        <span>{leftLabel}</span>
        <span className="text-ink">{label}</span>
        <span>{rightLabel}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-full bg-surface-soft accent-violet"
        aria-label={label}
      />
    </div>
  );
}

export function Toggle({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className={`flex min-h-11 cursor-pointer items-center justify-between gap-3 ${disabled ? "opacity-40" : ""}`}>
      <span className="text-sm font-semibold">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 rounded-full transition ${checked ? "bg-violet" : "bg-surface-soft border border-border"}`}
      >
        <span
          className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${checked ? "left-5.5" : "left-0.5"}`}
          style={{ left: checked ? "22px" : "2px" }}
        />
      </button>
    </label>
  );
}
