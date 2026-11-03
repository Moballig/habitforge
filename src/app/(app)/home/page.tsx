"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { useI18n } from "@/lib/i18n";
import { AreaChart, CalorieRing, PlateBalance } from "@/components/data/Charts";
import { HeroCard, PastelTile, StatTile } from "@/components/data/Cards";
import { Range, SectionLabel, SourceTag } from "@/components/data/Primitives";
import { NoticeCard, SafetyBanner } from "@/components/shell/Banners";
import { todayISO } from "@/lib/foods/search";
import { formatDayName, formatDate } from "@/lib/format";
import { Leaf, UtensilsCrossed, Wheat } from "lucide-react";
import { useState, useSyncExternalStore } from "react";
import { api } from "../../../../convex/_generated/api";

export default function HomePage() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const [overshootDismissed, setOvershootDismissed] = useState(false);
  // Client-only date; server snapshot is "" so prerender never calls new Date()
  const today = useSyncExternalStore(
    () => () => {},
    () => todayISO(),
    () => "",
  );
  const summary = useQuery(api.mealLogs.daySummary, today ? { date: today } : "skip");
  const budget = useQuery(api.budget.get, today ? { today } : "skip");

  if (summary === undefined || budget === undefined) {
    return (
      <div className="space-y-6">
        <div className="tile h-24 animate-pulse" aria-busy="true" aria-label="Loading home" />
        <div className="tile h-64 animate-pulse" aria-busy="true" />
      </div>
    );
  }

  if (budget === null) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-extrabold md:text-3xl">{t("home.hello")} 👋</h1>
        <NoticeCard
          tone="info"
          title={t("states.empty")}
          body="Set up your profile to see today's overview."
        />
        <Link href="/onboarding">
          <span className="font-bold underline">{t("home.setup")}</span>
        </Link>
      </div>
    );
  }

  const s = summary;
  const mode = budget.safetyMode;
  const targetLow = Math.round(budget.dailyTargetKcal * 0.9);
  const targetHigh = Math.round(budget.dailyTargetKcal * 1.1);
  const showOvershoot =
    mode === "normal" &&
    !overshootDismissed &&
    budget.overshootKcal > budget.toleranceKcal;

  const nextSlot = !s.bySlot.breakfast
    ? "breakfast"
    : !s.bySlot.lunch
      ? "lunch"
      : !s.bySlot.dinner
        ? "dinner"
        : null;
  const nextLabel = nextSlot
    ? nextSlot === "breakfast"
      ? t("home.logBreakfast")
      : nextSlot === "lunch"
        ? t("home.logLunch")
        : t("home.logDinner")
    : t("home.walk15");
  const nextSub = nextSlot ? t("home.walk15") : t("home.plateWhy");

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold md:text-3xl">
          {t("home.hello")}{budget.name ? `, ${budget.name}` : ""} 👋
        </h1>
        <p className="mt-1 text-sm text-ink/55">{formatDate(s.date, lang)}</p>
      </header>

      <SafetyBanner mode={mode} />

      {mode === "doctor-first" ? (
        <NoticeCard
          tone="info"
          title="No calorie targets in doctor-first mode"
          body="You can still log food. Please follow your clinician's advice."
          action={
            <Link href="/log" className="font-bold underline">
              {t("home.logMeal")}
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <HeroCard
            title={t("home.overview")}
            period={lang === "bn" ? "সপ্তাহ" : "Week"}
            onPeriod={() => {}}
            chart={
              <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-between">
                <CalorieRing
                  eatenLow={s.kcalLow}
                  eatenHigh={s.kcalHigh}
                  targetLow={targetLow}
                  targetHigh={targetHigh}
                  size={150}
                  animate
                />
                <div className="w-full max-w-sm">
                  <div className="mb-2 flex items-center justify-between text-xs font-semibold text-white/70">
                    <span>{t("home.eaten")}</span>
                    <span>{t("home.guide")}</span>
                  </div>
                  <div className="mb-3 text-sm">
                    <Range low={s.kcalLow} high={s.kcalHigh} className="font-bold" />
                    <span className="mx-2 opacity-50">/</span>
                    <span className="opacity-80">
                      {targetLow}–{targetHigh}
                    </span>
                  </div>
                  <AreaChart
                    data={budget.series.map((w) => w.kcal)}
                    target={budget.dailyTargetKcal}
                    labels={budget.series.map((w) => formatDayName(w.date, lang))}
                    highlightIndex={budget.series.length - 1}
                    animate
                    height={110}
                  />
                  <div className="mt-2 flex gap-1.5">
                    {budget.series.map((w, i) => (
                      <span
                        key={w.date}
                        className={`flex-1 rounded-full px-1 py-1 text-center text-[10px] font-bold ${
                          i === budget.series.length - 1 ? "bg-white text-violet" : "text-white/60"
                        }`}
                      >
                        {formatDayName(w.date, lang)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            }
            stats={[
              { label: t("home.protein"), value: `${s.macro.protein}g` },
              { label: t("home.carbs"), value: `${s.macro.carb}g` },
              { label: t("home.fat"), value: `${s.macro.fat}g` },
            ]}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <StatTile
              icon={Wheat}
              label={t("home.rice")}
              value={s.ricePortionLabel ?? "—"}
              spark={[1, 1.5, 1.2, 1.5, 1.5, 2, 1.5]}
            />
            <StatTile
              icon={Leaf}
              label={t("home.fibre")}
              value={s.macro.fiber}
              unit="g"
              spark={[12, 14, 15, 13, 16, 17, 18]}
            />
          </div>
        </div>
      )}

      {showOvershoot && (
        <NoticeCard
          tone="gentle"
          title={t("home.overshoot")}
          body={`${budget.overshootKcal} kcal · ${t("plan.spread")}`}
          action={
            <Link href="/plan" className="inline-flex min-h-11 items-center text-sm font-bold underline">
              {t("plan.spread")} →
            </Link>
          }
          onDismiss={() => setOvershootDismissed(true)}
        />
      )}

      <section>
        <SectionLabel>{t("home.plate")}</SectionLabel>
        <div className="card flex flex-col items-start gap-6 p-5 sm:flex-row sm:items-center">
          <PlateBalance
            veg={s.plate.veg}
            protein={s.plate.protein}
            grains={s.plate.grains}
            other={s.plate.other}
            size={150}
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-ink/60">{t("home.plateWhy")}</p>
            <p className="mt-3 flex gap-2">
              <SourceTag tag="fctb" />
              <SourceTag tag="estimated-recipe" />
            </p>
          </div>
        </div>
      </section>

      <section>
        <SectionLabel>{t("home.nextAction")}</SectionLabel>
        <PastelTile
          tone="sky"
          icon={UtensilsCrossed}
          label={nextLabel}
          sublabel={nextSub}
          onClick={() => router.push(nextSlot ? "/log" : "/activity")}
        />
      </section>
    </div>
  );
}
