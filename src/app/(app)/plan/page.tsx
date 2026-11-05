"use client";

import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { useI18n } from "@/lib/i18n";
import { SectionLabel, Range, SourceTag } from "@/components/data/Primitives";
import { NoticeCard, SafetyBanner } from "@/components/shell/Banners";
import { Button, Sheet, StepperInput } from "@/components/forms/Forms";
import { BarRangeChart } from "@/components/data/Charts";
import { todayISO } from "@/lib/foods/search";
import { formatDayName, formatShortDate } from "@/lib/format";
import { feastPreBank, postFeastRecovery } from "@/lib/engine";
import {
  Footprints,
  Utensils,
  HeartPulse,
  CalendarClock,
  Sparkles,
  Coins,
  Check,
  SlidersHorizontal,
} from "lucide-react";
import { useState, useSyncExternalStore } from "react";
import { api } from "../../../../convex/_generated/api";

function parseD(date: string): Date {
  return new Date(`${date}T12:00:00Z`);
}

function toISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, n: number): Date {
  const out = new Date(d);
  out.setUTCDate(out.getUTCDate() + n);
  return out;
}

const FEAST_PRESETS = [
  {
    id: "biriyani",
    nameEn: "Biriyani night",
    nameBn: "বিরিয়ানি রাত",
    kcal: 500,
    icon: "🍛",
    descEn: "~500 kcal extra",
    descBn: "~৫০০ অতিরিক্ত ক্যালরি",
  },
  {
    id: "wedding",
    nameEn: "Wedding dawat",
    nameBn: "বিয়ে / দাওয়াত",
    kcal: 800,
    icon: "🥘",
    descEn: "~800 kcal extra",
    descBn: "~৮০০ অতিরিক্ত ক্যালরি",
  },
  {
    id: "eid",
    nameEn: "Eid feast",
    nameBn: "ঈদের ভোজ",
    kcal: 1200,
    icon: "🍖",
    descEn: "~1200 kcal extra",
    descBn: "~১২০০ অতিরিক্ত ক্যালরি",
  },
] as const;

export default function PlanPage() {
  const { t, lang } = useI18n();
  // Client-only date; server snapshot is "" so prerender never calls new Date()
  const today = useSyncExternalStore(
    () => () => {},
    () => todayISO(),
    () => "",
  );
  const budget = useQuery(api.budget.get, today ? { today } : "skip");
  const setControls = useMutation(api.profile.setBudgetControls);

  const [extraMeals, setExtraMeals] = useState(1); // meal units of 600 kcal
  const [feastDate, setFeastDate] = useState("");
  const [feastExtra, setFeastExtra] = useState("800");
  const [feastTab, setFeastTab] = useState<"pre" | "post">("pre");
  const [postFeastOvershoot, setPostFeastOvershoot] = useState("800");
  const [postFeastDays, setPostFeastDays] = useState(3);

  // Sheets and acceptance state (A7)
  const [showAdjustSheet, setShowAdjustSheet] = useState(false);
  const [showWhatIfSheet, setShowWhatIfSheet] = useState(false);
  const [planAccepted, setPlanAccepted] = useState(false);

  const sim = useQuery(
    api.budget.whatIf,
    extraMeals > 0 && today
      ? { today, extraKcal: extraMeals * 600 }
      : "skip",
  );

  if (budget === undefined) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-extrabold md:text-3xl">{t("plan.title")}</h1>
        <div className="tile h-40 animate-pulse" aria-busy="true" aria-label="Loading budget" />
      </div>
    );
  }

  if (budget === null) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-extrabold md:text-3xl">{t("plan.title")}</h1>
        <NoticeCard
          tone="info"
          title={t("states.empty")}
          body="Set up your profile to see the 7-day budget."
        />
        <Link href="/onboarding">
          <Button>{t("home.setup")}</Button>
        </Link>
      </div>
    );
  }

  const mode = budget.safetyMode;
  const usedPct = Math.min((budget.weeklyUsed / budget.weeklyBudget) * 100, 100);

  if (mode === "doctor-first") {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-extrabold md:text-3xl">{t("plan.title")}</h1>
        <SafetyBanner mode={mode} />
        <NoticeCard tone="info" title={t("plan.doctorFirst")} body={t("safety.referral")} />
      </div>
    );
  }

  // Feast calculation logic (FR-E-09 reverse mode)
  const todayD = parseD(today);
  const defaultFeast = toISO(addDays(todayD, ((5 - todayD.getUTCDay() + 7) % 7) || 7));
  const feast = /^\d{4}-\d{2}-\d{2}$/.test(feastDate) ? feastDate : defaultFeast;
  const feastDays = Math.round((parseD(feast).getTime() - todayD.getTime()) / 86_400_000);
  const daysBefore = Math.min(7, Math.max(0, feastDays));
  const extra = Math.min(5000, Math.max(0, Number(feastExtra) || 0));
  const perDay =
    daysBefore > 0 && extra > 0
      ? feastPreBank({
          feastExtraKcal: extra,
          daysBefore,
          floorKcal: budget.floorKcal,
          targetKcal: budget.dailyTargetKcal,
        })
      : 0;
  const banked = perDay * daysBefore;
  const maxTrim = Math.max(0, budget.dailyTargetKcal - budget.floorKcal);
  const floorLimited = perDay > 0 && perDay >= maxTrim && (extra * 0.6) / daysBefore > maxTrim;

  const postOvershootNum = Math.min(5000, Math.max(100, Number(postFeastOvershoot) || 800));
  const postRecovery = postFeastRecovery({
    overshootKcal: postOvershootNum,
    recoveryDays: postFeastDays,
    targetKcal: budget.dailyTargetKcal,
    floorKcal: budget.floorKcal,
    weightKg: 65,
  });

  // Plain language sentence construction for "Your plan" card (A7)
  const peakOver = budget.series.find((s) => s.kcal > s.target);
  const peakDayName = peakOver ? formatDayName(peakOver.date, lang) : (lang === "bn" ? "শুক্রবার" : "Friday");
  const spreadDays = budget.plan.length || budget.windowDays;
  const dailyTrim = budget.plan[0]?.trimKcal ?? Math.round(budget.overshootKcal / spreadDays);

  const hasOvershoot = budget.overshootKcal > 0 && budget.plan.length > 0;
  const planSentence = hasOvershoot
    ? lang === "bn"
      ? `${peakDayName} একটু বেশি খাওয়া হয়েছে। পরের ${spreadDays} দিনে প্রতিদিন প্রায় ${dailyTrim} ক্যালরি ভাগ করে নিন।`
      : `${peakDayName} was bigger. Spread about ${dailyTrim} kcal over the next ${spreadDays} days.`
    : lang === "bn"
      ? "এই সপ্তাহে আপনি সঠিক ট্র্যাকে আছেন। কোনো ক্যালরি ভাগ করার প্রয়োজন নেই।"
      : "You're on track this week. Steady energy and balanced meals ahead.";

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold md:text-3xl">{t("plan.title")}</h1>
          <p className="mt-1 text-sm text-ink/55">
            {formatShortDate(budget.weekStart, lang)} → {formatShortDate(
              new Date(new Date(budget.weekStart).getTime() + 6 * 864e5),
              lang,
            )}
          </p>
        </div>
        {budget.overshootKcal > 0 ? (
          <span className="rounded-full bg-turmeric/15 px-3 py-1 text-xs font-bold text-turmeric">
            {budget.overshootKcal} kcal over
          </span>
        ) : (
          <span className="rounded-full bg-mint px-3 py-1 text-xs font-bold text-mint-ink">
            {lang === "bn" ? "বাজেটের মধ্যে" : "On track"}
          </span>
        )}
      </header>

      <SafetyBanner mode={mode} />

      {mode === "restricted" ? (
        <NoticeCard tone="info" title={t("plan.restricted")} body="Maintenance guidance only." />
      ) : (
        <>
          {/* ─── 1. Weekly Bar Chart First (A7) ─── */}
          <section className="card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div>
                <SectionLabel>{t("plan.budget")}</SectionLabel>
                <p className="text-xs text-ink/55">
                  {lang === "bn" ? "সাপ্তাহিক ক্যালরি বনাম লক্ষ্যমাত্রা" : "Weekly intake vs daily guide"}
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs text-ink/65">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="inline-block h-2 w-2 rounded-full bg-blue" />
                  {lang === "bn" ? "খাওয়া হয়েছে" : "Eaten"}
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="inline-block h-2 w-2 rounded-full bg-surface-soft border border-ink/30" />
                  {lang === "bn" ? "লক্ষ্য" : "Target"}
                </span>
              </div>
            </div>

            <BarRangeChart
              days={budget.series.map((s) => formatDayName(s.date, lang))}
              values={budget.series.map((s) => s.kcal)}
              targets={budget.series.map((s) => s.target)}
              highlightToday
            />

            <div className="mt-4 flex flex-wrap items-baseline justify-between gap-2 border-t border-border/40 pt-3 text-xs sm:text-sm">
              <span className="text-ink/65 font-medium">
                {t("plan.used")}: <strong className="text-ink">{Math.round(usedPct)}%</strong> ({budget.weeklyUsed.toLocaleString()} / {budget.weeklyBudget.toLocaleString()} kcal)
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-ink/50">
                  {lang === "bn" ? `ফ্লোর: ${budget.floorKcal} kcal` : `Floor: ${budget.floorKcal} kcal`}
                </span>
              </div>
            </div>
          </section>

          {/* ─── 2. One "Your Plan" Card (A7) ─── */}
          <section className="card p-5 border-2 border-violet/20 bg-gradient-to-br from-surface to-violet/5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-violet/10 px-3 py-1 text-xs font-bold text-violet uppercase tracking-wide">
                {t("plan.yourPlan")}
              </span>
              {/* "Try a meal first" link on the plan card (A7) */}
              <button
                type="button"
                onClick={() => setShowWhatIfSheet(true)}
                className="text-xs font-bold text-violet hover:underline inline-flex items-center gap-1"
              >
                <Sparkles size={13} />
                {t("plan.whatIf")}
              </button>
            </div>

            {/* Plain sentence (A7) */}
            <p className="text-base sm:text-lg font-bold text-ink leading-relaxed">
              {planSentence}
            </p>

            {hasOvershoot && (
              <div className="flex flex-wrap items-center gap-4 text-xs text-ink/70">
                <span className="inline-flex items-center gap-1.5 font-semibold text-violet">
                  <Utensils size={14} />
                  −{dailyTrim} kcal/d {lang === "bn" ? "খাবার" : "food"}
                </span>
                <span className="inline-flex items-center gap-1.5 font-semibold text-leaf">
                  <Footprints size={14} />
                  +{budget.plan[0]?.activityMin ?? 20} min {lang === "bn" ? "হাঁটা" : "walk"}
                </span>
                <span className="text-ink/45">
                  ({spreadDays} {lang === "bn" ? "দিনের ভাগ" : "days window"})
                </span>
              </div>
            )}

            {/* Buttons: Primary "Looks good", Secondary "Adjust" (A7) */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Button
                variant={planAccepted ? "secondary" : "primary"}
                onClick={() => setPlanAccepted(true)}
              >
                {planAccepted ? (
                  <span className="inline-flex items-center gap-1.5 text-leaf">
                    <Check size={16} />
                    {t("plan.looksGood")} ✓
                  </span>
                ) : (
                  t("plan.looksGood")
                )}
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowAdjustSheet(true)}
              >
                <span className="inline-flex items-center gap-1.5">
                  <SlidersHorizontal size={14} />
                  {t("plan.adjust")}
                </span>
              </Button>

              {planAccepted && (
                <span className="text-xs font-bold text-leaf animate-fade-in">
                  {t("plan.planAccepted")}
                </span>
              )}
            </div>
          </section>

          {/* ─── 3. "Eat well on a budget" Card Linking to Cheap Protein (A7 / A18) ─── */}
          <section className="card p-5 bg-gradient-to-br from-surface to-accent/5 border border-accent/25">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Coins size={18} className="text-accent-ink" />
                  <h3 className="font-extrabold text-base text-ink">
                    {t("plan.budgetCardTitle")}
                  </h3>
                </div>
                <p className="text-xs text-ink/70 max-w-lg leading-relaxed">
                  {t("plan.budgetCardDesc")}
                </p>
              </div>
              <Link href="/insights#cheap-protein" className="shrink-0">
                <Button variant="secondary">
                  {t("plan.budgetCardAction")}
                </Button>
              </Link>
            </div>
          </section>

          {/* ─── 4. Feast Presets: Biriyani, Wedding, Eid (A7) ─── */}
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <SectionLabel>{t("plan.feast")}</SectionLabel>
                <p className="text-xs text-ink/55">
                  {lang === "bn"
                    ? "দাওয়াত বা উৎসবের খাবার নিরাপদে সামলাতে নিচের ৩টি দ্রুত প্রিসেট বাছুন।"
                    : "Plan ahead or catch up after a feast with 3 prominent presets."}
                </p>
              </div>
              <div className="inline-flex rounded-full bg-surface-soft p-1">
                <button
                  type="button"
                  onClick={() => setFeastTab("pre")}
                  className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                    feastTab === "pre" ? "bg-violet text-white shadow-sm" : "text-ink/60 hover:text-ink"
                  }`}
                >
                  {lang === "bn" ? "ভোজের আগে সঞ্চয়" : "Pre-bank"}
                </button>
                <button
                  type="button"
                  onClick={() => setFeastTab("post")}
                  className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                    feastTab === "post" ? "bg-violet text-white shadow-sm" : "text-ink/60 hover:text-ink"
                  }`}
                >
                  {lang === "bn" ? "ভোজের পর সমন্বয়" : "Post-feast catch-up"}
                </button>
              </div>
            </div>

            {/* 3 Prominent Feast Preset Buttons (A7) */}
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              {FEAST_PRESETS.map((preset) => {
                const isSelected =
                  (feastTab === "pre" ? feastExtra : postFeastOvershoot) === String(preset.kcal);
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setFeastExtra(String(preset.kcal));
                      setPostFeastOvershoot(String(preset.kcal));
                    }}
                    className={`flex flex-col items-start p-3.5 rounded-card border text-left transition-all ${
                      isSelected
                        ? "border-violet bg-violet/10 ring-2 ring-violet/20"
                        : "border-border bg-surface hover:bg-surface-soft/60"
                    }`}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span className="text-2xl">{preset.icon}</span>
                      <span className="rounded-full bg-surface-soft px-2 py-0.5 text-[11px] font-bold text-ink/70">
                        +{preset.kcal} kcal
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-bold text-ink">
                      {lang === "bn" ? preset.nameBn : preset.nameEn}
                    </p>
                    <p className="text-[11px] text-ink/50">
                      {lang === "bn" ? preset.descBn : preset.descEn}
                    </p>
                  </button>
                );
              })}
            </div>

            {feastTab === "pre" ? (
              <div className="card space-y-4 p-5">
                <p className="text-xs text-ink/60">
                  {lang === "bn"
                    ? "সামনে কোনো অনুষ্ঠান বা দাওয়াত আছে? আগে থেকেই ছোট ছোট সঞ্চয় করে সপ্তাহের বাজেট ঠিক রাখুন।"
                    : "Upcoming dawat or wedding? Bank a little each day beforehand so the feast stays inside your weekly budget."}
                </p>
                <div className="flex flex-wrap gap-3">
                  <label className="min-w-[10rem] flex-1">
                    <span className="text-xs font-semibold text-ink/50">{t("plan.feastDate")}</span>
                    <input
                      type="date"
                      value={feast}
                      min={today}
                      onChange={(e) => setFeastDate(e.target.value)}
                      className="mt-1 w-full rounded-tile border border-line bg-white px-3 py-2.5 font-num tabular outline-none focus:border-violet"
                    />
                  </label>
                  <label className="min-w-[10rem] flex-1">
                    <span className="text-xs font-semibold text-ink/50">{t("plan.feastExtra")}</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={100}
                      max={5000}
                      step={50}
                      value={feastExtra}
                      onChange={(e) => setFeastExtra(e.target.value)}
                      className="mt-1 w-full rounded-tile border border-line bg-white px-3 py-2.5 font-num tabular outline-none focus:border-violet"
                    />
                  </label>
                </div>
                {perDay === 0 ? (
                  <p className="text-sm text-ink/50">{t("plan.pickFuture")}</p>
                ) : (
                  <div className="flex flex-wrap items-center gap-3 rounded-tile bg-mint px-4 py-3 text-sm font-semibold text-mint-ink">
                    <Sparkles size={16} />
                    −{perDay} kcal/d × {daysBefore} d ≈ {banked} kcal {t("plan.banked")}
                    <span className="font-normal opacity-70">
                      {formatShortDate(today, lang)} → {formatShortDate(feast, lang)}
                    </span>
                  </div>
                )}
                {floorLimited && (
                  <p className="text-xs text-ink/45">{t("plan.floor")}</p>
                )}
              </div>
            ) : (
              <div className="card space-y-4 p-5">
                <div>
                  <h3 className="text-sm font-bold">
                    {lang === "bn" ? "দাওয়াত বা ভারী খাবারের পর সহমর্মী প্ল্যান" : "Gentle Post-Dawat Catch-Up Plan"}
                  </h3>
                  <p className="mt-0.5 text-xs text-ink/60">
                    {lang === "bn"
                      ? "কোনো অপরাধবোধ বা উপবাস নয়। অতিরিক্ত ক্যালরি ২–৫ দিনে হালকা খাবার সাশ্রয় ও হাঁটায় সমন্বয় করা হবে।"
                      : "No guilt, no crash starvation. Covers excess calories across 2–5 days through modest meal trims and light walking."}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <label className="min-w-[10rem] flex-1">
                    <span className="text-xs font-semibold text-ink/50">
                      {lang === "bn" ? "অতিরিক্ত ক্যালরি (আনুমানিক)" : "Estimated excess kcal"}
                    </span>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={100}
                      max={5000}
                      step={50}
                      value={postFeastOvershoot}
                      onChange={(e) => setPostFeastOvershoot(e.target.value)}
                      className="mt-1 w-full rounded-tile border border-line bg-white px-3 py-2.5 font-num tabular outline-none focus:border-violet"
                    />
                  </label>
                  <label className="min-w-[10rem] flex-1">
                    <span className="text-xs font-semibold text-ink/50">
                      {lang === "bn" ? "পুনরুদ্ধার সময়কাল" : "Recovery spread window"}
                    </span>
                    <select
                      value={postFeastDays}
                      onChange={(e) => setPostFeastDays(Number(e.target.value))}
                      className="mt-1 w-full rounded-tile border border-line bg-white px-3 py-2.5 font-num outline-none focus:border-violet"
                    >
                      <option value={2}>2 {lang === "bn" ? "দিন" : "days"}</option>
                      <option value={3}>3 {lang === "bn" ? "দিন (সুপারিশকৃত)" : "days (recommended)"}</option>
                      <option value={4}>4 {lang === "bn" ? "দিন" : "days"}</option>
                      <option value={5}>5 {lang === "bn" ? "দিন (অতি মৃদু)" : "days (gentle)"}</option>
                    </select>
                  </label>
                </div>

                {/* Summary banner */}
                <div className="rounded-tile bg-violet/10 p-3.5 text-xs text-ink/80 space-y-1">
                  <p className="font-bold text-violet">
                    {lang === "bn"
                      ? `মোট সাশ্রয়: ~${postRecovery.coveredKcal} ক্যালরি (${postRecovery.coveragePercent}% কভার) · দৈনিক −${postRecovery.dailyTrimKcal} খাবার + ${postRecovery.dailyWalkMinutes} মিনিট হাঁটা`
                      : `Target recovery: ~${postRecovery.coveredKcal} kcal (${postRecovery.coveragePercent}% cover) · Daily −${postRecovery.dailyTrimKcal} food + ${postRecovery.dailyWalkMinutes} min walk`}
                  </p>
                  <p className="text-ink/60">
                    {lang === "bn"
                      ? `কখনই আপনার নিরাপদ ফ্লোরের (${budget.floorKcal} kcal) নিচে নামানো হবে না।`
                      : `Never pushes below your personal safe floor (${budget.floorKcal} kcal).`}
                  </p>
                </div>

                {/* Day-by-day breakdown */}
                <div className="grid gap-2 sm:grid-cols-3">
                  {postRecovery.schedule.map((day) => (
                    <div key={day.dayIndex} className="rounded-card border border-border bg-surface-soft/60 p-3">
                      <p className="text-xs font-bold text-violet">
                        {lang === "bn" ? `দিন ${day.dayIndex}` : `Day ${day.dayIndex}`}
                      </p>
                      <p className="mt-1 text-xs text-ink/75">
                        🥗 −{day.trimKcal} kcal {lang === "bn" ? "খাবার" : "food"}
                      </p>
                      <p className="text-xs text-ink/75">
                        🚶‍♂️ +{day.extraWalkMinutes} min {lang === "bn" ? "হাঁটা" : "walk"} (≈{day.activityNetKcal} kcal)
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* ─── Bottom Navigation Buttons ─── */}
          <div className="flex flex-wrap gap-3 pt-2">
            <Link href="/family">
              <Button variant="secondary">
                {lang === "bn" ? "পারিবারিক মেনু" : "Family menu"}
              </Button>
            </Link>
            <Link href="/activity">
              <Button variant="secondary">{t("activity.title")}</Button>
            </Link>
            <Link href="/log">
              <Button>{t("home.logMeal")}</Button>
            </Link>
          </div>

          {/* ─── Adjust Sheet (A7): Spread Over, Split, Controls, Elastic Band ─── */}
          <Sheet
            open={showAdjustSheet}
            onClose={() => setShowAdjustSheet(false)}
            title={t("plan.adjust")}
          >
            <div className="space-y-5">
              {/* Spread over: 3 to 7 days stepper (A7) */}
              <div>
                <StepperInput
                  label={t("plan.window")}
                  value={budget.windowDays}
                  min={3}
                  max={7}
                  unit={lang === "bn" ? "দিন" : "days"}
                  onChange={(v) =>
                    void setControls({
                      windowDays: v,
                      intakeShare: budget.intakeShare,
                    })
                  }
                />
                <p className="mt-1 text-xs text-ink/50">
                  {lang === "bn"
                    ? "৩ থেকে ৭ দিনের মধ্যে ক্যালরি সমন্বয় নির্বাচন করুন।"
                    : "Choose between 3 and 7 days to gently spread calories."}
                </p>
              </div>

              {/* Food and movement split (A7) */}
              <div>
                <span className="mb-1.5 block text-sm font-medium text-ink/55">
                  {t("plan.split")}
                </span>
                <div className="flex gap-2">
                  {[0.5, 0.6, 0.7].map((share) => (
                    <button
                      key={share}
                      type="button"
                      className={`flex-1 rounded-card py-2.5 text-xs font-bold transition ${
                        Math.abs(budget.intakeShare - share) < 0.01
                          ? "bg-violet text-white shadow-sm"
                          : "bg-surface-soft text-ink/70 hover:bg-surface-soft/80 border border-border/50"
                      }`}
                      onClick={() =>
                        void setControls({
                          windowDays: budget.windowDays,
                          intakeShare: share,
                        })
                      }
                    >
                      {Math.round(share * 100)}% {lang === "bn" ? "খাবার" : "Food"} / {100 - Math.round(share * 100)}% {lang === "bn" ? "হাঁটা" : "Move"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Safe Floor & Cap Controls Readout */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-tile bg-surface-soft px-3 py-2.5 border border-border/40">
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold text-ink/50">
                    <HeartPulse size={12} className="text-rose" /> {t("plan.floor")}
                  </p>
                  <p className="font-num mt-0.5 text-sm font-extrabold tabular">
                    {budget.floorKcal} kcal
                  </p>
                </div>
                <div className="rounded-tile bg-surface-soft px-3 py-2.5 border border-border/40">
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold text-ink/50">
                    <Footprints size={12} className="text-leaf" /> {t("plan.cap")}
                  </p>
                  <p className="font-num mt-0.5 text-sm font-extrabold tabular">
                    {budget.activityCapNet} kcal
                  </p>
                </div>
              </div>

              {/* ─── Elastic Band Visual Inside Adjust Section (A7 / A12) ─── */}
              <div className="space-y-2 rounded-card bg-surface-soft/80 p-4 border border-border/50">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-violet flex items-center gap-1.5">
                    <Sparkles size={13} />
                    {lang === "bn" ? "ইলাস্টিক রিব্যালেন্স ব্যান্ড" : "Elastic Rebalance Band"}
                  </span>
                  <span className="text-[11px] font-bold text-ink/60 font-num">
                    {budget.windowDays} {lang === "bn" ? "দিন প্রসারিত" : "days stretch"}
                  </span>
                </div>

                {/* Elastic ribbon bar */}
                <div className="relative my-3">
                  <div className="h-2.5 w-full rounded-full bg-gradient-to-r from-violet via-blue to-leaf opacity-90 shadow-sm" />
                  <div className="mt-2.5 flex justify-between text-[11px] font-semibold text-ink/75">
                    {Array.from({ length: budget.windowDays }, (_, i) => (
                      <div key={i} className="flex flex-col items-center">
                        <span className="h-2.5 w-2.5 rounded-full bg-surface border-2 border-violet shadow-xs" />
                        <span className="mt-1 font-num text-[10px] text-ink/60">
                          {lang === "bn" ? `দিন ${i + 1}` : `Day ${i + 1}`}
                        </span>
                        <span className="font-num text-[10px] font-bold text-violet">
                          −{dailyTrim}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-[11px] text-ink/60 leading-relaxed pt-1">
                  {lang === "bn"
                    ? `ইলাস্টিক রিব্যালেন্স আপনার অতিরিক্ত শক্তিকে কোনো অনাহার ছাড়াই দৈনিক সর্বনিম্ন নিরাপদ সীমার (${budget.floorKcal} kcal) উপরে রেখে ${budget.windowDays} দিনে সমানভাবে ছড়িয়ে দেয়।`
                    : `Elastic rebalance stretches surplus energy gently across ${budget.windowDays} days safely above your metabolic floor (${budget.floorKcal} kcal).`}
                </p>
              </div>

              {/* Schedule list inside adjust */}
              {budget.plan.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-ink/50">
                    {lang === "bn" ? "নির্ধারিত রূপরেখা:" : "Scheduled outline:"}
                  </p>
                  <ul className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                    {budget.plan.map((day) => (
                      <li
                        key={day.date}
                        className="tile flex items-center justify-between p-2.5 text-xs"
                      >
                        <div>
                          <span className="font-bold">{formatDayName(day.date, lang)}</span>
                          <span className="ml-1 text-ink/40 text-[10px]">{formatShortDate(day.date, lang)}</span>
                          <p className="text-ink/60 text-[11px]">
                            trim −{day.trimKcal} kcal · +{day.activityMin} min walk
                          </p>
                        </div>
                        <SourceTag tag="estimated" />
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <Button full onClick={() => setShowAdjustSheet(false)}>
                {lang === "bn" ? "সম্পন্ন" : "Done"}
              </Button>
            </div>
          </Sheet>

          {/* ─── What-If Simulator Sheet (A7 / A4: "Try a meal first") ─── */}
          <Sheet
            open={showWhatIfSheet}
            onClose={() => setShowWhatIfSheet(false)}
            title={t("plan.whatIf")}
          >
            <div className="space-y-4">
              <p className="text-xs text-ink/60">
                {lang === "bn"
                  ? "খাওয়ার আগেই পরীক্ষা করে দেখুন অতিরিক্ত খাবার কীভাবে সপ্তাহের বাজেটে প্রভাব ফেলে।"
                  : "Preview before you eat to see how extra meals spread across your 7-day budget."}
              </p>

              <div className="flex items-center justify-between card p-3">
                <span className="text-sm font-semibold text-ink/80">
                  {lang === "bn" ? "অতিরিক্ত খাবার (প্রতিটি ~৬০০ kcal)" : "Extra meals (~600 kcal each)"}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="h-9 w-9 rounded-full bg-surface-soft font-bold flex items-center justify-center text-base"
                    onClick={() => setExtraMeals(Math.max(0, extraMeals - 1))}
                    aria-label="Less"
                  >
                    −
                  </button>
                  <span className="font-num w-6 text-center font-extrabold tabular text-base">
                    {extraMeals}
                  </span>
                  <button
                    type="button"
                    className="h-9 w-9 rounded-full bg-surface-soft font-bold flex items-center justify-center text-base"
                    onClick={() => setExtraMeals(Math.min(5, extraMeals + 1))}
                    aria-label="More"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-tile bg-peach/40 border border-peach/60 px-4 py-3 text-sm font-semibold text-ink">
                <Sparkles size={18} className="text-turmeric shrink-0" />
                <span>
                  {extraMeals === 0
                    ? `≈ +0 kcal · ${t("plan.noPlan")}`
                    : !sim
                      ? "…"
                      : sim.blocked
                        ? "≈ +600 kcal · maintenance only in this mode"
                        : sim.plan.length === 0
                          ? `≈ +${extraMeals * 600} kcal · ${lang === "bn" ? "সাপ্তাহিক বাজেটের মধ্যে রয়েছে — কোনো ছড়ানোর দরকার নেই" : "within weekly budget — no plan needed"}`
                          : `≈ +${extraMeals * 600} kcal · ${sim.overshootKcal} kcal over → trim ${sim.plan[0]!.trimKcal} kcal/d over ${sim.plan.length} days`}
                </span>
              </div>

              <p className="text-xs text-ink/50">
                {lang === "bn"
                  ? `কখনই আপনার সর্বনিম্ন নিরাপদ ফ্লোরের (${budget.floorKcal} kcal) নিচে নামবে না এবং ব্যায়াম সীমার মধ্যে থাকবে।`
                  : `Never drops below your lowest safe floor (${budget.floorKcal} kcal) and honors activity caps.`}
              </p>

              <Button full onClick={() => setShowWhatIfSheet(false)}>
                {lang === "bn" ? "বুঝেছি" : "Got it"}
              </Button>
            </div>
          </Sheet>
        </>
      )}
    </div>
  );
}
