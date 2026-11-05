"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { useI18n } from "@/lib/i18n";
import { AreaChart, CalorieRing, PlateBalance } from "@/components/data/Charts";
import { HeroCard } from "@/components/data/Cards";
import { Range, SectionLabel, SourceTag, Chip } from "@/components/data/Primitives";
import { NoticeCard, SafetyBanner } from "@/components/shell/Banners";
import { todayISO } from "@/lib/foods/search";
import { formatDayName, formatDate } from "@/lib/format";
import {
  AlertCircle,
  Bike,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Droplets,
  Dumbbell,
  Footprints,
  Minus,
  Moon,
  Plus,
  UtensilsCrossed,
  Waves,
} from "lucide-react";
import { useState, useSyncExternalStore } from "react";
import { api } from "../../../../convex/_generated/api";
import { outdoorAdvice } from "@/lib/engine";
import { nextMove } from "@/lib/engine/nextMove";
import { calculateWaterProgress } from "@/lib/engine/water";
import {
  CONDITION_PLATE_PRESETS,
  getPlatePresetForProfile,
  evaluatePlateBalance,
  type HealthCondition,
} from "@/lib/engine/conditionPlates";

const EXERCISE_ICONS = {
  walk: Footprints,
  cycle: Bike,
  home: Dumbbell,
  yoga: Waves,
} as const;

export default function HomePage() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const [overshootDismissed, setOvershootDismissed] = useState(false);
  const [selectedCondition, setSelectedCondition] = useState<HealthCondition | null>(null);
  const [showPlateDetails, setShowPlateDetails] = useState(false);

  // Client-only date; server snapshot is "" so prerender never calls new Date()
  const today = useSyncExternalStore(
    () => () => {},
    () => todayISO(),
    () => "",
  );
  const summary = useQuery(api.mealLogs.daySummary, today ? { date: today } : "skip");
  const budget = useQuery(api.budget.get, today ? { today } : "skip");
  const profile = useQuery(api.profile.get, {});
  const weather = useQuery(api.weather.get, {});
  const water = useQuery(api.water.get, today ? { date: today } : "skip");
  const logWater = useMutation(api.water.log);
  const advice = outdoorAdvice(weather?.aqi ?? null, weather?.feelsC ?? null);
  // Client-only hour; server snapshot matches SSR-safe default
  const hour = useSyncExternalStore(
    () => () => {},
    () => new Date().getHours(),
    () => 12,
  );

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

  const move = nextMove({
    safetyMode: mode,
    targetKcal: budget.dailyTargetKcal,
    eatenLow: s.kcalLow,
    eatenHigh: s.kcalHigh,
    overshootKcal: budget.overshootKcal,
    toleranceKcal: budget.toleranceKcal,
    bySlot: s.bySlot,
    plate: s.plate,
    planActivityMin: budget.plan.find((p) => p.date === today)?.activityMin ?? 0,
    weightKg: profile?.weightKg ?? 65,
    hour,
    indoor: advice.indoor,
    womenFriendly: profile?.womenFriendlyPrivacy ?? false,
  });

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

          <div className="space-y-4">
            <div className="card space-y-3 p-5">
              <p className="text-xs font-semibold text-ink/50">
                {lang === "bn" ? "সুপারিশ করা ব্যায়াম" : "Recommended exercise"}
              </p>
              {(move.exercise ?? []).map((opt) => {
                const Icon = EXERCISE_ICONS[opt.type];
                return (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => router.push("/activity")}
                    className="flex min-h-11 w-full items-center justify-between gap-3 rounded-card bg-emerald-50 p-3 text-left hover:opacity-90 dark:bg-emerald-950/40"
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-bold">
                        <Icon size={14} className="mr-1 inline align-[-2px]" />
                        {opt.minutes} min {lang === "bn" ? opt.labelBn : opt.labelEn}
                      </span>
                      <span className="block text-xs text-ink/60">
                        ≈ {opt.kcalLow}–{opt.kcalHigh} kcal ·{" "}
                        {opt.indoor
                          ? lang === "bn"
                            ? "ঘরের ভিতরে"
                            : "indoors"
                          : lang === "bn"
                            ? "বাইরে"
                            : "outdoors"}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm font-bold text-violet">→</span>
                  </button>
                );
              })}
              {!move.exercise && (
                <p className="text-sm text-ink/60">
                  {lang === "bn"
                    ? "বিশ্রামও পরিকল্পনার অংশ — আজ কিছু নির্ধারিত নেই।"
                    : "Rest is part of the plan — nothing scheduled today."}
                </p>
              )}
            </div>

            {/* Hydration / Water Tracking Card */}
            {(() => {
              const waterData = calculateWaterProgress(water?.glasses ?? 0, water?.targetGlasses ?? 8);
              return (
                <div className="card space-y-3 p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-100 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400">
                        <Droplets size={18} />
                      </span>
                      <div>
                        <h3 className="text-sm font-bold">{t("home.water")}</h3>
                        <p className="text-xs text-ink/60">
                          {waterData.glasses} / {waterData.targetGlasses} {lang === "bn" ? "গ্লাস" : "glasses"} ({waterData.ml} ml)
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => today && logWater({ date: today, delta: -1 })}
                        disabled={waterData.glasses === 0}
                        className="flex h-8 w-8 items-center justify-center rounded-card border border-border text-ink/70 transition hover:bg-surface-soft disabled:opacity-30"
                        aria-label="Decrease water"
                      >
                        <Minus size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => today && logWater({ date: today, delta: 1 })}
                        className="flex h-8 items-center gap-1 rounded-card bg-sky-500 px-3 text-xs font-bold text-white transition hover:bg-sky-600 active:scale-95 shadow-sm"
                      >
                        <Plus size={14} />
                        <span>+250ml</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-sky-100 dark:bg-sky-950/40">
                      <div
                        className="h-full rounded-full bg-sky-500 transition-all duration-300"
                        style={{ width: `${waterData.pct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-ink/50">
                      <span>{waterData.pct}% {lang === "bn" ? "সম্পূর্ণ" : "reached"}</span>
                      <span>{waterData.targetMl} ml {lang === "bn" ? "লক্ষ্য" : "daily goal"}</span>
                    </div>
                  </div>
                </div>
              );
            })()}
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

      {/* Condition-Aware Plate Presets (FR-G-01 & FR-G-02) */}
      {(() => {
        const matchedPreset = getPlatePresetForProfile(profile ?? undefined);
        const activePreset = selectedCondition
          ? CONDITION_PLATE_PRESETS[selectedCondition]
          : matchedPreset;
        const evaluation = evaluatePlateBalance(s.plate, activePreset);

        return (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <SectionLabel>{t("home.plate")}</SectionLabel>
              <span className="text-xs font-semibold text-violet">
                {lang === "bn" ? activePreset.titleBn : activePreset.titleEn}
              </span>
            </div>

            {/* Condition Mode Selector */}
            <div className="flex flex-wrap gap-2">
              <Chip
                selected={activePreset.id === "general"}
                onClick={() => setSelectedCondition("general")}
              >
                {lang === "bn" ? "সাধারণ সুষম" : "General Healthy"}
              </Chip>
              <Chip
                selected={activePreset.id === "diabetes"}
                onClick={() => setSelectedCondition("diabetes")}
              >
                🩺 {lang === "bn" ? "ডায়াবেটিস গ্লাইসেমিক" : "Diabetes Plate (FR-G-01)"}
              </Chip>
              <Chip
                selected={activePreset.id === "hypertension"}
                onClick={() => setSelectedCondition("hypertension")}
              >
                ❤️ {lang === "bn" ? "উচ্চ রক্তচাপ সোডিয়াম" : "Hypertension Watch (FR-G-02)"}
              </Chip>
            </div>

            <div className="card space-y-4 p-5">
              <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
                <PlateBalance
                  veg={s.plate.veg}
                  protein={s.plate.protein}
                  grains={s.plate.grains}
                  other={s.plate.other}
                  size={150}
                />
                <div className="min-w-0 flex-1 space-y-2">
                  <p className="text-sm text-ink/70">
                    {lang === "bn" ? activePreset.descriptionBn : activePreset.descriptionEn}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <SourceTag tag="fctb" />
                    <SourceTag tag="estimated-recipe" />
                  </div>
                </div>
              </div>

              {/* Plate Evaluation Advice */}
              <div
                className={`flex items-start gap-3 rounded-card p-3 text-sm ${
                  evaluation.isWellBalanced
                    ? "bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
                    : "bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
                }`}
              >
                {evaluation.isWellBalanced ? (
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600" />
                ) : (
                  <AlertCircle size={18} className="mt-0.5 shrink-0 text-amber-600" />
                )}
                <div>
                  <p className="font-semibold">
                    {evaluation.isWellBalanced
                      ? lang === "bn"
                        ? "চমৎকার প্লেট ভারসাম্য!"
                        : "Great Plate Balance!"
                      : lang === "bn"
                        ? "প্লেট ভারসাম্যের পরামর্শ:"
                        : "Plate Adjustment Tip:"}
                  </p>
                  <p className="mt-0.5 text-xs opacity-90">
                    {lang === "bn" ? evaluation.adviceBn : evaluation.adviceEn}
                  </p>
                </div>
              </div>

              {/* Expandable Clinical & Food Details */}
              <button
                type="button"
                onClick={() => setShowPlateDetails(!showPlateDetails)}
                className="flex w-full items-center justify-between text-xs font-bold text-violet hover:opacity-80 pt-1"
              >
                <span>
                  {showPlateDetails
                    ? lang === "bn"
                      ? "পরামর্শ সংক্ষেপ করুন"
                      : "Hide guideline foods & clinical notes"
                    : lang === "bn"
                      ? "প্রস্তাবিত দেশি খাবার ও নির্দেশিকা দেখুন"
                      : "View recommended deshi foods & rules"}
                </span>
                {showPlateDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {showPlateDetails && (
                <div className="space-y-4 border-t border-border pt-3">
                  {/* Rules */}
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-ink/50">
                      {lang === "bn" ? "মূল নিয়মাবলী" : "Key Guidelines"}
                    </p>
                    <ul className="mt-1.5 list-inside list-disc space-y-1 text-xs text-ink/70">
                      {(lang === "bn" ? activePreset.keyRulesBn : activePreset.keyRulesEn).map(
                        (rule, idx) => (
                          <li key={idx}>{rule}</li>
                        ),
                      )}
                    </ul>
                  </div>

                  {/* Recommended Foods */}
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                      {lang === "bn" ? "প্রস্তাবিত খাবার" : "Recommended Local Foods"}
                    </p>
                    <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
                      {activePreset.recommendedFoods.map((f, idx) => (
                        <div key={idx} className="tile p-2.5 text-xs">
                          <p className="font-bold">
                            {lang === "bn" ? f.nameBn : f.nameEn}
                          </p>
                          <p className="text-[11px] text-ink/55">{f.note}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Restricted Foods */}
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-rose">
                      {lang === "bn" ? "সীমাবদ্ধ বা বর্জনীয়" : "Foods to Limit"}
                    </p>
                    <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
                      {activePreset.restrictedFoods.map((f, idx) => (
                        <div key={idx} className="tile p-2.5 text-xs">
                          <p className="font-bold text-rose">
                            {lang === "bn" ? f.nameBn : f.nameEn}
                          </p>
                          <p className="text-[11px] text-ink/55">{f.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Clinical Disclaimer */}
                  <div className="rounded-card border border-amber-300/40 bg-amber-500/10 p-3 text-[11px] leading-relaxed text-ink/75">
                    <p className="font-bold text-ink">
                      ⚠️ {lang === "bn" ? "চিকিৎসা সংক্রান্ত সতর্কতা:" : "Clinical Disclaimer:"}
                    </p>
                    <p className="mt-0.5">{activePreset.clinicalDisclaimer}</p>
                    <p className="mt-1 font-semibold text-ink/60">
                      Source: {activePreset.guidelineSource}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>
        );
      })()}

      <section className="space-y-3">
        <SectionLabel>{t("home.nextAction")}</SectionLabel>
        <div className="card space-y-4 p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet/10 text-violet">
              {move.kind === "eat" ? (
                <UtensilsCrossed size={18} />
              ) : move.kind === "move" ? (
                <Footprints size={18} />
              ) : move.kind === "rest" ? (
                <Moon size={18} />
              ) : (
                <CheckCircle2 size={18} />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-bold">{lang === "bn" ? move.headlineBn : move.headlineEn}</p>
              <p className="mt-0.5 text-sm text-ink/60">
                {lang === "bn" ? move.detailBn : move.detailEn}
              </p>
            </div>
          </div>

          {move.food && (
            <button
              type="button"
              onClick={() => router.push("/log")}
              className="flex min-h-11 w-full items-center justify-between gap-3 rounded-card bg-sky-50 p-3 text-left hover:opacity-90 dark:bg-sky-950/40"
            >
              <span className="min-w-0">
                <span className="block text-sm font-bold">
                  🍽 {lang === "bn" ? move.food.nameBn : move.food.nameEn}
                </span>
                <span className="block text-xs text-ink/60">
                  {move.food.kcalLow}–{move.food.kcalHigh} kcal ·{" "}
                  {lang === "bn" ? move.food.whyBn : move.food.whyEn}
                </span>
              </span>
              <span className="shrink-0 text-sm font-bold text-violet">→</span>
            </button>
          )}

          {move.cta === "plan" && (
            <button
              type="button"
              onClick={() => router.push("/plan")}
              className="flex min-h-11 w-full items-center justify-between gap-3 rounded-card bg-violet/10 p-3 text-left hover:opacity-90"
            >
              <span className="text-sm font-bold">{t("plan.spread")}</span>
              <span className="text-sm font-bold text-violet">→</span>
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
