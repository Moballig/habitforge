"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { useI18n } from "@/lib/i18n";
import { AreaChart, CalorieRing, PlateBalance } from "@/components/data/Charts";
import { HeroCard, PastelTile, StatTile } from "@/components/data/Cards";
import { Range, SectionLabel, SourceTag, Chip } from "@/components/data/Primitives";
import { NoticeCard, SafetyBanner } from "@/components/shell/Banners";
import { todayISO } from "@/lib/foods/search";
import { formatDayName, formatDate } from "@/lib/format";
import { AlertCircle, CheckCircle2, ChevronDown, ChevronUp, HeartPulse, Leaf, Stethoscope, UtensilsCrossed, Wheat } from "lucide-react";
import { useState, useSyncExternalStore } from "react";
import { api } from "../../../../convex/_generated/api";
import {
  CONDITION_PLATE_PRESETS,
  getPlatePresetForProfile,
  evaluatePlateBalance,
  type HealthCondition,
} from "@/lib/engine/conditionPlates";

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
