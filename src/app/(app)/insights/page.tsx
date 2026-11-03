"use client";

import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { useState, useSyncExternalStore } from "react";
import { useI18n } from "@/lib/i18n";
import { AreaChart } from "@/components/data/Charts";
import { SectionLabel, SourceTag } from "@/components/data/Primitives";
import { NoticeCard } from "@/components/shell/Banners";
import { Button } from "@/components/forms/Forms";
import { todayISO } from "@/lib/foods/search";
import { formatShortDate } from "@/lib/format";
import { Scale, TrendingUp } from "lucide-react";
import { api } from "../../../../convex/_generated/api";

export default function InsightsPage() {
  const { t, lang } = useI18n();
  const today = useSyncExternalStore(
    () => () => {},
    () => todayISO(),
    () => "",
  );
  const data = useQuery(api.weights.trend, today ? { today } : "skip");
  const addWeighIn = useMutation(api.weights.add);
  const [weight, setWeight] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  if (data === undefined) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-extrabold md:text-3xl">{t("nav.insights")}</h1>
        <div className="tile h-40 animate-pulse" aria-busy="true" aria-label="Loading insights" />
      </div>
    );
  }

  if (data === null) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-extrabold md:text-3xl">{t("nav.insights")}</h1>
        <NoticeCard
          tone="info"
          title={t("states.empty")}
          body="Set up your profile to see insights."
        />
        <Link href="/onboarding">
          <Button>{t("home.setup")}</Button>
        </Link>
      </div>
    );
  }

  const a = data.adaptive;
  const statusLabel =
    a.status === "formula"
      ? t("insights.statusFormula")
      : a.status === "settled"
        ? t("insights.statusSettled")
        : t("plan.improving");
  const statusTone =
    a.status === "settled"
      ? "bg-mint text-mint-ink"
      : a.status === "improving"
        ? "bg-sky text-sky-ink"
        : "bg-peach text-peach-ink";

  async function save() {
    const n = Number.parseFloat(weight.replace(",", "."));
    setError("");
    setSaved(false);
    if (!Number.isFinite(n) || n < 20 || n > 300) {
      setError("20–300 kg");
      return;
    }
    try {
      await addWeighIn({ date: today, weightKg: Math.round(n * 10) / 10 });
      setWeight("");
      setSaved(true);
    } catch {
      setError(t("common.retry"));
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold md:text-3xl">{t("nav.insights")}</h1>
        <p className="mt-1 text-sm text-ink/55">{formatShortDate(today, lang)}</p>
      </header>

      <section>
        <SectionLabel>{t("insights.weighIn")}</SectionLabel>
        <div className="card flex flex-wrap items-end gap-3 p-5">
          <label className="flex-1">
            <span className="text-xs font-semibold text-ink/50">{t("insights.weight")} (kg)</span>
            <input
              type="number"
              inputMode="decimal"
              min={20}
              max={300}
              step={0.1}
              value={weight}
              onChange={(e) => {
                setWeight(e.target.value);
                setSaved(false);
                setError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") void save();
              }}
              placeholder={data.weighIns.at(-1)?.weightKg.toFixed(1) ?? "60.0"}
              className="mt-1 w-full rounded-tile border border-line bg-white px-3 py-2.5 font-num tabular outline-none focus:border-violet"
            />
          </label>
          <Button onClick={() => void save()}>{t("insights.addWeighIn")}</Button>
          {saved && (
            <span className="text-sm font-bold text-mint-ink" role="status">
              ✓ {t("insights.saved")}
            </span>
          )}
          {error && (
            <span className="text-sm font-bold text-coral" role="alert">
              {error}
            </span>
          )}
        </div>
      </section>

      <section>
        <SectionLabel>{t("insights.trend")}</SectionLabel>
        {data.weighIns.length < 2 ? (
          <NoticeCard tone="gentle" title={t("insights.noWeighIns")} body="" />
        ) : (
          <div className="card p-5">
            <AreaChart
              data={data.weighIns.map((w) => w.weightKg)}
              labels={data.weighIns.map((w) => formatShortDate(w.date, lang))}
              highlightIndex={data.weighIns.length - 1}
              animate
              height={140}
            />
            <p className="mt-2 flex items-center gap-2 text-xs text-ink/50">
              <TrendingUp size={13} />
              {data.weighIns[0]!.weightKg.toFixed(1)} →{" "}
              {data.weighIns.at(-1)!.weightKg.toFixed(1)} kg ·{" "}
              {data.weightDeltaKg > 0 ? "+" : ""}
              {data.weightDeltaKg} kg / {data.days} d
              <SourceTag tag="measured" />
            </p>
          </div>
        )}
      </section>

      <section>
        <SectionLabel>{t("plan.adaptive")}</SectionLabel>
        <div className="card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="flex items-center gap-2">
              <Scale size={16} className="text-ink/40" />
              <span className="font-num text-3xl font-extrabold tabular">
                {a.estimateKcal.toLocaleString()}
              </span>
              <span className="text-sm text-ink/50">kcal/day</span>
            </p>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusTone}`}>
              {statusLabel}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <Meta label={t("plan.adaptive")} value={`${data.formulaTdee}`} sub="formula" />
            <Meta label={t("insights.avgIntake")} value={`${data.avgIntakeKcal}`} sub="kcal" />
            <Meta
              label={t("insights.confidence")}
              value={`${Math.round(a.confidence * 100)}%`}
              sub={`${data.days} d`}
            />
          </div>

          {a.status !== "settled" && (
            <p className="mt-4 text-sm text-ink/60">
              {t("insights.needsWeighIns").replace("{n}", String(a.moreWeighInsNeeded))}
            </p>
          )}
          {a.noiseNote && (
            <p className="mt-2 text-xs text-ink/45">{t("insights.noise")}</p>
          )}
        </div>
      </section>
    </div>
  );
}

function Meta({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-tile bg-surface-soft px-3 py-2.5">
      <p className="text-[11px] font-semibold text-ink/50">{label}</p>
      <p className="font-num mt-0.5 text-sm font-extrabold tabular">
        {value} <span className="text-[10px] font-semibold text-ink/40">{sub}</span>
      </p>
    </div>
  );
}
