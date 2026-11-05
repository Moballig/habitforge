"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { useI18n } from "@/lib/i18n";
import { CalorieRing, PlateBalance } from "@/components/data/Charts";
import { SourceTag, Chip } from "@/components/data/Primitives";
import { NoticeCard, SafetyBanner } from "@/components/shell/Banners";
import { todayISO } from "@/lib/foods/search";
import { formatDate, formatKcal } from "@/lib/format";
import {
  AlertCircle,
  Bike,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Droplets,
  Dumbbell,
  Footprints,
  HelpCircle,
  Moon,
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

function getGreeting(hour: number, lang: "en" | "bn") {
  if (hour < 12) {
    return lang === "bn" ? "শুভ সকাল" : "Good morning";
  }
  if (hour < 17) {
    return lang === "bn" ? "শুভ দুপুর" : "Good afternoon";
  }
  return lang === "bn" ? "শুভ সন্ধ্যা" : "Good evening";
}

function getPrimaryAction(hour: number, lang: "en" | "bn") {
  if (hour < 11) {
    return {
      label: lang === "bn" ? "সকালের নাস্তা লগ করুন" : "Log breakfast",
      href: "/log",
    };
  }
  if (hour < 16) {
    return {
      label: lang === "bn" ? "দুপুরের খাবার লগ করুন" : "Log lunch",
      href: "/log",
    };
  }
  if (hour < 19) {
    return {
      label: lang === "bn" ? "বিকালের নাস্তা লগ করুন" : "Log snacks",
      href: "/log",
    };
  }
  return {
    label: lang === "bn" ? "রাতের খাবার লগ করুন" : "Log dinner",
    href: "/log",
  };
}

export default function HomePage() {
  const { t, lang, setLang } = useI18n();
  const router = useRouter();
  const [overshootDismissed, setOvershootDismissed] = useState(false);
  const [selectedCondition, setSelectedCondition] = useState<HealthCondition | null>(null);
  const [plateAccordionOpen, setPlateAccordionOpen] = useState(false);
  const [detailsAccordionOpen, setDetailsAccordionOpen] = useState(false);

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

  // Client-only hour
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

  const avgEaten = Math.round((s.kcalLow + s.kcalHigh) / 2);
  const primaryAction = getPrimaryAction(hour, lang);

  const matchedPreset = getPlatePresetForProfile(profile ?? undefined);
  const activePreset = selectedCondition
    ? CONDITION_PLATE_PRESETS[selectedCondition]
    : matchedPreset;
  const plateEvaluation = evaluatePlateBalance(s.plate, activePreset);
  const waterData = calculateWaterProgress(water?.glasses ?? 0, water?.targetGlasses ?? 8);

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
    <div className="space-y-5">
      {/* 1. One-line greeting + language switch */}
      <header className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-extrabold text-ink sm:text-2xl">
            {getGreeting(hour, lang)}{budget.name ? `, ${budget.name}` : ""} 👋
          </h1>
          <p className="text-xs text-ink/55">{formatDate(s.date, lang)}</p>
        </div>
        <button
          type="button"
          onClick={() => setLang(lang === "en" ? "bn" : "en")}
          className="shrink-0 min-h-9 rounded-full border border-border bg-surface px-3 text-xs font-bold transition hover:bg-surface-soft active:scale-95"
          aria-label="Switch language"
        >
          {lang === "en" ? "বাংলা" : "EN"}
        </button>
      </header>

      <SafetyBanner mode={mode} />

      {/* 2. Today Card: Calorie ring + headline + status + single primary action */}
      <section className="card p-6 space-y-5">
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:justify-start">
          <div className="shrink-0">
            <CalorieRing
              eatenLow={s.kcalLow}
              eatenHigh={s.kcalHigh}
              targetLow={targetLow}
              targetHigh={targetHigh}
              size={140}
              animate
            />
          </div>

          <div className="w-full text-center sm:text-left space-y-1.5">
            <p className="text-xs font-bold uppercase tracking-wider text-ink/50">
              {t("common.today")}
            </p>

            <div className="flex flex-wrap items-baseline justify-center sm:justify-start gap-1.5">
              <span className="font-num text-3xl sm:text-4xl font-extrabold tabular text-ink">
                {t("common.about")} {formatKcal(avgEaten, lang)}
              </span>
              <span className="text-sm font-semibold text-ink/60">
                {lang === "bn" ? `এর মধ্যে ${formatKcal(budget.dailyTargetKcal, lang)} ক্যালরি` : `of ${formatKcal(budget.dailyTargetKcal, lang)} kcal`}
              </span>
            </div>

            <p className="text-xs text-ink/50">
              {t("common.range")} {formatKcal(s.kcalLow, lang)}–{formatKcal(s.kcalHigh, lang)} {t("common.kcal")}
            </p>

            {/* Status sentence */}
            <div className="pt-1">
              {showOvershoot ? (
                <div className="inline-flex items-center gap-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 px-3 py-1.5 text-xs font-bold text-amber-800 dark:text-amber-200">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  <span>
                    {lang === "bn"
                      ? "পরিকল্পনার চেয়ে একটু বেশি হয়েছে। সপ্তাহজুড়ে ভাগ করে সামলে নিন।"
                      : "A bigger day than planned · Spread it over the week."}
                  </span>
                  <Link href="/plan" className="underline font-extrabold hover:opacity-80">
                    {lang === "bn" ? "প্ল্যান দেখুন" : "View plan"} →
                  </Link>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 size={15} />
                  <span>{lang === "bn" ? "আপনি ঠিক পথে আছেন।" : "You're on track."}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* The Single Primary Action Button */}
        <button
          type="button"
          onClick={() => router.push(primaryAction.href)}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-violet text-sm font-bold text-white shadow-sm transition hover:opacity-90 active:scale-98"
        >
          <UtensilsCrossed size={17} />
          <span>{primaryAction.label}</span>
        </button>
      </section>

      {/* 3. Hydration row (+250ml quick action) */}
      <section className="card flex items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky/20 text-sky-600 dark:text-sky-300">
            <Droplets size={20} />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-ink">{t("home.water")}</span>
              <span className="text-xs font-medium text-ink/60">
                {waterData.glasses} / {waterData.targetGlasses} {lang === "bn" ? "গ্লাস" : "glasses"} ({waterData.ml} ml)
              </span>
            </div>
            <div className="mt-1 flex gap-1">
              {Array.from({ length: waterData.targetGlasses }).map((_, i) => (
                <span
                  key={i}
                  className={`h-2 w-3.5 sm:w-4 rounded-xs transition-colors ${
                    i < waterData.glasses
                      ? "bg-sky-500"
                      : "bg-sky-100 dark:bg-sky-950"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            if (today) void logWater({ date: today, delta: 1 });
          }}
          className="h-10 shrink-0 flex items-center gap-1 rounded-full bg-sky-500 px-4 text-xs font-bold text-white shadow-xs hover:bg-sky-600 active:scale-95 transition"
        >
          <span>+250 ml</span>
        </button>
      </section>

      {/* 4. Rice portion row (calibrated bati) */}
      <section className="card flex items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300">
            <UtensilsCrossed size={18} />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-ink">
              {lang === "bn" ? "ভাতের পরিমাণ: ১ মাঝারি বাটি" : "Rice: 1 medium bati"}
            </p>
            <p className="text-xs text-ink/55 truncate">
              {lang === "bn" ? "আপনার পরিমাপ অনুযায়ী স্বাভাবিক বাটি (≈২৪০ গ্রাম)" : "Calibrated standard bowl (≈240g cooked)"}
            </p>
          </div>
        </div>

        <Link
          href="/log/rice"
          className="h-9 shrink-0 inline-flex items-center rounded-full border border-border px-3.5 text-xs font-bold text-ink hover:bg-surface-soft active:scale-95 transition"
        >
          {lang === "bn" ? "ক্যালিব্রেট" : "Calibrate"}
        </Link>
      </section>

      {/* 5. Collapsible accordions for: Today's Plate preset, Details & How we calculate */}
      <div className="space-y-3 pt-1">
        {/* Accordion A: Today's Plate preset */}
        <div className="card overflow-hidden">
          <button
            type="button"
            onClick={() => setPlateAccordionOpen(!plateAccordionOpen)}
            className="flex w-full items-center justify-between p-4 text-left font-bold hover:bg-surface-soft transition"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm text-ink">{t("home.plate")}</span>
              <span className="rounded-full bg-violet/10 px-2 py-0.5 text-[11px] font-semibold text-violet">
                {lang === "bn" ? activePreset.titleBn : activePreset.titleEn}
              </span>
            </div>
            {plateAccordionOpen ? <ChevronUp size={18} className="text-ink/60" /> : <ChevronDown size={18} className="text-ink/60" />}
          </button>

          {plateAccordionOpen && (
            <div className="border-t border-border p-5 space-y-4">
              {/* Condition Mode Selector Chips */}
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
                  🩺 {lang === "bn" ? "ডায়াবেটিস গ্লাইসেমিক" : "Diabetes Plate"}
                </Chip>
                <Chip
                  selected={activePreset.id === "hypertension"}
                  onClick={() => setSelectedCondition("hypertension")}
                >
                  ❤️ {lang === "bn" ? "উচ্চ রক্তচাপ সোডিয়াম" : "Hypertension Watch"}
                </Chip>
              </div>

              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <PlateBalance
                  veg={s.plate.veg}
                  protein={s.plate.protein}
                  grains={s.plate.grains}
                  other={s.plate.other}
                  size={130}
                />
                <div className="min-w-0 flex-1 space-y-2 text-xs">
                  <p className="text-ink/70">
                    {lang === "bn" ? activePreset.descriptionBn : activePreset.descriptionEn}
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <SourceTag tag="fctb" />
                    <SourceTag tag="estimated-recipe" />
                  </div>
                </div>
              </div>

              {/* Plate Evaluation Advice */}
              <div
                className={`flex items-start gap-3 rounded-card p-3 text-xs ${
                  plateEvaluation.isWellBalanced
                    ? "bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200 border border-emerald-200"
                    : "bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200 border border-amber-200"
                }`}
              >
                {plateEvaluation.isWellBalanced ? (
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                ) : (
                  <AlertCircle size={16} className="mt-0.5 shrink-0 text-amber-600" />
                )}
                <div>
                  <p className="font-semibold">
                    {plateEvaluation.isWellBalanced
                      ? lang === "bn"
                        ? "চমৎকার প্লেট ভারসাম্য!"
                        : "Great Plate Balance!"
                      : lang === "bn"
                        ? "প্লেট ভারসাম্যের পরামর্শ:"
                        : "Plate Adjustment Tip:"}
                  </p>
                  <p className="mt-0.5 opacity-90">
                    {lang === "bn" ? plateEvaluation.adviceBn : plateEvaluation.adviceEn}
                  </p>
                </div>
              </div>

              {/* Recommended & Limits */}
              <div className="grid gap-3 sm:grid-cols-2 text-xs">
                <div>
                  <p className="font-bold uppercase tracking-wider text-emerald-600 text-[11px]">
                    {lang === "bn" ? "প্রস্তাবিত খাবার" : "Recommended Local Foods"}
                  </p>
                  <div className="mt-1.5 space-y-1">
                    {activePreset.recommendedFoods.slice(0, 3).map((f, idx) => (
                      <div key={idx} className="tile p-2">
                        <p className="font-bold">{lang === "bn" ? f.nameBn : f.nameEn}</p>
                        <p className="text-[10px] text-ink/55">{f.note}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 text-[11px]">
                    {lang === "bn" ? "সীমাবদ্ধ বা বর্জনীয়" : "Foods to Limit"}
                  </p>
                  <div className="mt-1.5 space-y-1">
                    {activePreset.restrictedFoods.slice(0, 3).map((f, idx) => (
                      <div key={idx} className="tile p-2 border-amber-200/50">
                        <p className="font-bold text-amber-800 dark:text-amber-300">
                          {lang === "bn" ? f.nameBn : f.nameEn}
                        </p>
                        <p className="text-[10px] text-ink/55">{f.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Clinical note */}
              <div className="rounded-card border border-amber-200 bg-amber-500/10 p-2.5 text-[11px] text-ink/75">
                <p className="font-bold text-ink">
                  ⚠️ {lang === "bn" ? "চিকিৎসা সংক্রান্ত সতর্কতা:" : "Clinical Disclaimer:"}
                </p>
                <p className="mt-0.5">{activePreset.clinicalDisclaimer}</p>
              </div>
            </div>
          )}
        </div>

        {/* Accordion B: Details & How we calculate */}
        <div className="card overflow-hidden">
          <button
            type="button"
            onClick={() => setDetailsAccordionOpen(!detailsAccordionOpen)}
            className="flex w-full items-center justify-between p-4 text-left font-bold hover:bg-surface-soft transition"
          >
            <div className="flex items-center gap-2">
              <HelpCircle size={17} className="text-ink/60" />
              <span className="text-sm text-ink">
                {lang === "bn" ? "বিস্তারিত ও হিসাবের নিয়ম" : "Details & How we calculate"}
              </span>
            </div>
            {detailsAccordionOpen ? <ChevronUp size={18} className="text-ink/60" /> : <ChevronDown size={18} className="text-ink/60" />}
          </button>

          {detailsAccordionOpen && (
            <div className="border-t border-border p-5 space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="tile p-3">
                  <p className="text-[11px] font-semibold text-ink/60">{t("plan.maintenance")}</p>
                  <p className="font-num text-lg font-extrabold text-ink tabular mt-0.5">
                    {formatKcal(budget.dailyTargetKcal, lang)} {t("common.kcal")}
                  </p>
                  <p className="text-[10px] text-ink/50 mt-1">
                    {lang === "bn" ? "বয়স, ওজন ও শারীরিক পরিশ্রম অনুযায়ী দৈনিক শক্তি" : "Energy used daily from profile and activity"}
                  </p>
                  <div className="mt-2">
                    <SourceTag tag="fctb" />
                  </div>
                </div>

                <div className="tile p-3">
                  <p className="text-[11px] font-semibold text-ink/60">{t("plan.safeFloor")}</p>
                  <p className="font-num text-lg font-extrabold text-ink tabular mt-0.5">
                    {formatKcal(budget.floorKcal, lang)} {t("common.kcal")}
                  </p>
                  <p className="text-[10px] text-ink/50 mt-1">
                    {lang === "bn" ? "সর্বনিম্ন নিরাপদ বিপাকীয় সীমা (কখনও এর নিচে নয়)" : "Metabolic minimum floor (never cut below)"}
                  </p>
                  <div className="mt-2">
                    <SourceTag tag="borrowed" />
                  </div>
                </div>

                <div className="tile p-3">
                  <p className="text-[11px] font-semibold text-ink/60">{t("plan.dailyTarget")}</p>
                  <p className="font-num text-lg font-extrabold text-ink tabular mt-0.5">
                    {formatKcal(budget.dailyTargetKcal, lang)} {t("common.kcal")}
                  </p>
                  <p className="text-[10px] text-ink/50 mt-1">
                    {lang === "bn" ? "ভারসাম্যপূর্ণ স্বাস্থ্যরক্ষার জন্য দৈনিক লক্ষ্য" : "Balanced daily target for sustainable health"}
                  </p>
                  <div className="mt-2">
                    <SourceTag tag="borrowed" />
                  </div>
                </div>
              </div>

              {/* Macro breakdown */}
              <div className="tile flex items-center justify-around p-3 text-center">
                <div>
                  <p className="text-[11px] font-semibold text-ink/60">{t("home.protein")}</p>
                  <p className="font-num text-sm font-extrabold text-ink tabular">{s.macro.protein}g</p>
                </div>
                <div className="h-6 w-px bg-border" />
                <div>
                  <p className="text-[11px] font-semibold text-ink/60">{t("home.carbs")}</p>
                  <p className="font-num text-sm font-extrabold text-ink tabular">{s.macro.carb}g</p>
                </div>
                <div className="h-6 w-px bg-border" />
                <div>
                  <p className="text-[11px] font-semibold text-ink/60">{t("home.fat")}</p>
                  <p className="font-num text-sm font-extrabold text-ink tabular">{s.macro.fat}g</p>
                </div>
              </div>

              {/* Movement advice preview if available */}
              {move.exercise && move.exercise.length > 0 && (
                <div className="tile p-3 space-y-2">
                  <p className="text-xs font-bold text-ink">
                    {lang === "bn" ? "আজকের হাঁটা ও শরীরচর্চার ধারণা:" : "Movement recommendations:"}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {move.exercise.map((opt) => {
                      const Icon = EXERCISE_ICONS[opt.type];
                      return (
                        <Link
                          key={opt.type}
                          href="/activity"
                          className="inline-flex items-center gap-1.5 rounded-full bg-surface border border-border px-3 py-1 text-xs font-semibold hover:bg-surface-soft"
                        >
                          <Icon size={13} className="text-violet" />
                          <span>{opt.minutes}m {lang === "bn" ? opt.labelBn : opt.labelEn}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
