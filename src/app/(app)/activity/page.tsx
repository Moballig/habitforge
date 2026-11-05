"use client";

import Link from "next/link";
import { useAction, useMutation, useQuery } from "convex/react";
import { useI18n } from "@/lib/i18n";
import { SemiGauge, BarRangeChart } from "@/components/data/Charts";
import { PastelTile, StatTile } from "@/components/data/Cards";
import { SectionLabel, Range, SourceTag } from "@/components/data/Primitives";
import { NoticeCard } from "@/components/shell/Banners";
import { Button } from "@/components/forms/Forms";
import {
  ACTIVITY_METS,
  DEFAULT_MINUTES,
  outdoorAdvice,
  stepsToMinutes,
  calculatePrayerTimes,
  getSafeActivitySlots,
  getCurrentSlot,
  getRegionCoords,
  SMALL_SPACE_ROUTINES,
  getSmallSpaceRoutineKcal,
  BEGINNER_WALK_PLAN,
  getBeginnerWalkStage,
  getBeginnerWalkKcal,
  ACTIVITY_PYRAMID_TIERS,
} from "@/lib/engine";
import { exerciseRec } from "@/lib/engine/exercise";
import { todayISO } from "@/lib/foods/search";
import { formatDayName } from "@/lib/format";
import {
  Bike,
  ChevronDown,
  ChevronUp,
  Dumbbell,
  Footprints,
  House,
  Trophy,
  Waves,
  ListTodo,
  Flame,
  Clock,
  Moon,
  Sparkles,
} from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { api } from "../../../../convex/_generated/api";

const WEEK_GOAL = 150; // WHO: 150 min moderate activity per week

const TILES: Array<{
  type: keyof typeof DEFAULT_MINUTES;
  labelKey: string;
  tone: "mint" | "sky" | "lilac" | "peach";
  icon: typeof Footprints;
}> = [
  { type: "walk", labelKey: "activity.walk", tone: "sky", icon: Footprints },
  { type: "cycle", labelKey: "activity.cycle", tone: "mint", icon: Bike },
  { type: "home", labelKey: "activity.homeWorkout", tone: "lilac", icon: Dumbbell },
  { type: "cricket", labelKey: "activity.cricket", tone: "peach", icon: Trophy },
  { type: "yoga", labelKey: "activity.yoga", tone: "mint", icon: Waves },
  { type: "chores", labelKey: "activity.chores", tone: "sky", icon: House },
];

// FR-D-05 gate: these need outdoors — muted and pushed back when AQI/heat is bad.
const OUTDOOR_TYPES = new Set<string>(["walk", "cycle", "cricket"]);
function isOutdoor(type: string): boolean {
  return OUTDOOR_TYPES.has(type);
}

const REC_ICONS = {
  walk: Footprints,
  cycle: Bike,
  home: Dumbbell,
  yoga: Waves,
} as const;

export default function ActivityPage() {
  const { t, lang } = useI18n();
  const today = useSyncExternalStore(
    () => () => {},
    () => todayISO(),
    () => "",
  );
  const week = useQuery(api.activity.listWeek, today ? { today } : "skip");
  const budget = useQuery(api.budget.get, today ? { today } : "skip");
  const summary = useQuery(api.mealLogs.daySummary, today ? { date: today } : "skip");
  const profile = useQuery(api.profile.get, {});
  const createActivity = useMutation(api.activity.create);
  const removeActivity = useMutation(api.activity.remove);
  const setWomenPrivacy = useMutation(api.profile.setWomenFriendlyPrivacy);
  const weather = useQuery(api.weather.get, {});
  const refreshWeather = useAction(api.weather.refresh);
  useEffect(() => {
    void refreshWeather({});
  }, [refreshWeather]);
  const advice = outdoorAdvice(weather?.aqi ?? null, weather?.feelsC ?? null);
  const hour = useSyncExternalStore(
    () => () => {},
    () => new Date().getHours(),
    () => 12,
  );
  const [steps, setSteps] = useState("");
  const [error, setError] = useState("");
  const [expandedRoutine, setExpandedRoutine] = useState<string | null>(null);
  const [selectedWalkWeek, setSelectedWalkWeek] = useState(1);
  const [showPyramid, setShowPyramid] = useState(false);

  if (week === undefined || budget === undefined || summary === undefined) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-extrabold md:text-3xl">{t("activity.title")}</h1>
        <div className="tile h-40 animate-pulse" aria-busy="true" aria-label="Loading activity" />
      </div>
    );
  }

  if (week === null || budget === null) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-extrabold md:text-3xl">{t("activity.title")}</h1>
        <NoticeCard
          tone="info"
          title={t("states.empty")}
          body="Set up your profile to log activity."
        />
        <Link href="/onboarding">
          <Button>{t("home.setup")}</Button>
        </Link>
      </div>
    );
  }

  const todayEntries = week.entries.filter((e) => e.date === today);

  const currentMinutes = useSyncExternalStore(
    () => () => {},
    () => {
      const d = new Date();
      return d.getHours() * 60 + d.getMinutes();
    },
    () => 12 * 60,
  );
  const isFasting = profile?.eatingStyle?.includes("fasting") ?? false;
  const regionCoords = getRegionCoords(profile?.homeRegion);
  const prayerTimes = calculatePrayerTimes(new Date(), profile?.homeRegion);
  const activitySlots = getSafeActivitySlots(prayerTimes, isFasting);
  const currentSlotInfo = getCurrentSlot(activitySlots, currentMinutes);

  const rec = exerciseRec({
    safetyMode: budget.safetyMode,
    overshootKcal: budget.overshootKcal,
    toleranceKcal: budget.toleranceKcal,
    planActivityMin: budget.plan.find((p) => p.date === today)?.activityMin ?? 0,
    weightKg: profile?.weightKg ?? 65,
    hour,
    indoor: advice.indoor,
    womenFriendly: profile?.womenFriendlyPrivacy ?? false,
  });

  const walkStage = getBeginnerWalkStage(selectedWalkWeek);
  const walkKcal = getBeginnerWalkKcal(walkStage.dailyMinutes, profile?.weightKg ?? 65);
  const nextActivitySlotLabel = currentSlotInfo.activeSlot
    ? (lang === "bn" ? currentSlotInfo.activeSlot.labelBn : currentSlotInfo.activeSlot.labelEn)
    : (lang === "bn" ? currentSlotInfo.nextSlot.labelBn : currentSlotInfo.nextSlot.labelEn);

  async function log(type: string, minutes?: number) {
    setError("");
    const existing = todayEntries.find((e) => e.type === type);
    try {
      if (existing) {
        await removeActivity({ id: existing._id });
      } else {
        await createActivity({
          date: today,
          type,
          minutes: minutes ?? DEFAULT_MINUTES[type] ?? 30,
          source: "preset",
        });
      }
    } catch {
      setError(t("common.retry"));
    }
  }

  async function addSteps() {
    setError("");
    const n = Number.parseInt(steps, 10);
    if (!Number.isFinite(n) || n < 1 || n > 100_000) {
      setError("1–100000");
      return;
    }
    try {
      await createActivity({ date: today, type: "steps", minutes: n, source: "steps" });
      setSteps("");
    } catch {
      setError(t("common.retry"));
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold md:text-3xl">{t("activity.title")}</h1>
          <p className="mt-1 text-xs font-semibold text-ink/50">{t("activity.privacyBadge")}</p>
        </div>
        <button
          type="button"
          onClick={() => void setWomenPrivacy({ enabled: !profile?.womenFriendlyPrivacy })}
          className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
            profile?.womenFriendlyPrivacy
              ? "bg-rose/15 text-rose border border-rose/30 shadow-xs"
              : "bg-surface-soft text-ink/65 border border-border hover:bg-peach"
          }`}
          title="Modest home-only workout routines and privacy framing"
        >
          <span>🌸</span>
          <span>{lang === "bn" ? "নারী-বান্ধব হোম মোড" : "Women-Friendly Mode"}</span>
          <span className="rounded-full bg-ink/10 px-1.5 py-0.2 text-[10px] uppercase tracking-wider">
            {profile?.womenFriendlyPrivacy ? (lang === "bn" ? "চালু" : "ON") : (lang === "bn" ? "বন্ধ" : "OFF")}
          </span>
        </button>
      </header>

      {rec && (
        <section>
          <SectionLabel>
            {lang === "bn" ? "আজকের সুপারিশ" : "Recommended today"}
          </SectionLabel>
          <div className="card space-y-3 p-5">
            <p className="text-sm text-ink/60">{lang === "bn" ? rec.whyBn : rec.whyEn}</p>
            {rec.options.map((opt) => {
              const Icon = REC_ICONS[opt.type];
              const logged = todayEntries.some((e) => e.type === opt.type);
              return (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => void log(opt.type, opt.minutes)}
                  className="flex min-h-11 w-full items-center justify-between gap-3 rounded-card bg-surface-soft p-3 text-left hover:bg-peach"
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
                  <span className="shrink-0 text-sm font-bold text-violet">
                    {logged ? `✓ ${opt.minutes} min ×` : `+ ${opt.minutes} min →`}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <section className="card flex flex-col items-center gap-6 p-5 sm:flex-row sm:justify-between">
        <SemiGauge
          value={week.weekMinutes}
          max={Math.max(WEEK_GOAL, week.weekMinutes)}
          label={t("activity.weekMinutes")}
          valueLabel={`${week.weekMinutes} min`}
          size={190}
        />
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${
              week.weekMinutes >= WEEK_GOAL
                ? "bg-mint text-mint-ink"
                : "bg-peach text-peach-ink"
            }`}
          >
            <Trophy size={13} />
            {week.weekMinutes >= WEEK_GOAL
              ? t("activity.onTrack")
              : `${Math.max(0, WEEK_GOAL - week.weekMinutes)} min to goal`}
          </span>
          <p className="mt-3 text-sm text-ink/60">
            <Range low={week.weekNetKcalLow} high={week.weekNetKcalHigh} unit="kcal" />{" "}
            {t("activity.netKcal")}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-1.5 sm:justify-start">
            {todayEntries.length === 0 ? (
              <span className="text-xs text-ink/45">{t("activity.empty")}</span>
            ) : (
              todayEntries.map((e) => (
                <button
                  key={e._id}
                  type="button"
                  onClick={() => void removeActivity({ id: e._id })}
                  className="rounded-full bg-surface-soft px-3 py-1.5 text-xs font-semibold hover:bg-peach"
                  aria-label={`Remove ${e.type}`}
                >
                  {e.type} · {e.minutes} min ·{" "}
                  <Range low={e.netKcalLow} high={e.netKcalHigh} unit="" className="text-[11px]" />{" "}
                  ×
                </button>
              ))
            )}
            <SourceTag tag="estimated" />
          </div>
        </div>
      </section>

      <section>
        <SectionLabel>{t("activity.exercise")}</SectionLabel>
        {advice.indoor && weather && (
          <div className="mb-3">
            <NoticeCard
              tone="info"
              title={`${t("activity.indoor")}${weather.regionNameEn ? ` · ${lang === "bn" ? weather.regionNameBn : weather.regionNameEn}` : ""}`}
              body={
                advice.reason === "aqi"
                  ? t("activity.indoorAqi").replace("{aqi}", String(weather.aqi))
                  : t("activity.indoorHeat").replace("{temp}", String(weather.feelsC))
              }
            />
          </div>
        )}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {(advice.indoor
            ? [...TILES].sort(
                (a, b) => Number(isOutdoor(b.type)) - Number(isOutdoor(a.type)),
              )
            : TILES
          ).map((tile) => {
            const loggedToday = todayEntries.some((e) => e.type === tile.type);
            const Icon = tile.icon;
            const muted = advice.indoor && isOutdoor(tile.type);
            return (
              <div key={tile.type} className={muted ? "opacity-55" : undefined}>
                <PastelTile
                  tone={tile.tone}
                  icon={Icon}
                  label={t(tile.labelKey)}
                  sublabel={
                    loggedToday
                      ? `✓ ${DEFAULT_MINUTES[tile.type]} min`
                      : `+ ${DEFAULT_MINUTES[tile.type]} min`}
                  onClick={() => void log(tile.type)}
                />
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label>
            <span className="text-xs font-semibold text-ink/50">
              {t("activity.stepsManual")} ({stepsToMinutes(Number(steps) || 0)} min)
            </span>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={100_000}
              value={steps}
              onChange={(e) => setSteps(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void addSteps();
              }}
              placeholder="8000"
              className="mt-1 block w-36 rounded-tile border border-line bg-white px-3 py-2.5 font-num tabular outline-none focus:border-violet"
            />
          </label>
          <Button onClick={() => void addSteps()}>{t("activity.stepsManual")}</Button>
          {error && (
            <span className="text-sm font-bold text-coral" role="alert">
              {error}
            </span>
          )}
        </div>
        <p className="mt-2 text-xs text-ink/45">
          ~100 steps/min walking equivalent · {ACTIVITY_METS.steps} MET
        </p>
      </section>

      {/* Prayer-Time & Ramadan Activity Windows (FR-D-06) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <SectionLabel>
            {lang === "bn" ? "নামাজের সময় ও নিরাপদ ব্যায়াম স্লট" : "Prayer Times & Safe Activity Windows"}
          </SectionLabel>
          <span className="text-xs font-semibold text-ink/50">
            {lang === "bn" ? "বিভাগ: " : "Division: "}
            <span className="font-bold text-violet">
              {lang === "bn" ? regionCoords.nameBn : regionCoords.nameEn}
            </span>
          </span>
        </div>

        {/* 5 Daily Prayer times strip */}
        <div className="card p-4">
          <div className="grid grid-cols-5 divide-x divide-border text-center">
            <div className="px-1">
              <p className="text-[11px] font-semibold text-ink/50">{lang === "bn" ? "ফজর" : "Fajr"}</p>
              <p className="font-num text-xs font-bold sm:text-sm">{prayerTimes.fajr}</p>
            </div>
            <div className="px-1">
              <p className="text-[11px] font-semibold text-ink/50">{lang === "bn" ? "যোহর" : "Dhuhr"}</p>
              <p className="font-num text-xs font-bold sm:text-sm">{prayerTimes.dhuhr}</p>
            </div>
            <div className="px-1">
              <p className="text-[11px] font-semibold text-ink/50">{lang === "bn" ? "আসর" : "Asr"}</p>
              <p className="font-num text-xs font-bold sm:text-sm">{prayerTimes.asr}</p>
            </div>
            <div className="px-1">
              <p className="text-[11px] font-semibold text-ink/50">{lang === "bn" ? "মাগরিব / ইফতার" : "Maghrib / Iftar"}</p>
              <p className="font-num text-xs font-bold sm:text-sm text-amber-600 dark:text-amber-400">{prayerTimes.maghrib}</p>
            </div>
            <div className="px-1">
              <p className="text-[11px] font-semibold text-ink/50">{lang === "bn" ? "এশা / তারাবি" : "Isha / Taraweeh"}</p>
              <p className="font-num text-xs font-bold sm:text-sm">{prayerTimes.isha}</p>
            </div>
          </div>
        </div>

        {/* Safe Activity Windows Cards */}
        <div className="grid gap-3 sm:grid-cols-2">
          {activitySlots.map((slot) => {
            const isCurrent = slot.id === currentSlotInfo.activeSlot?.id;
            const isNext = !currentSlotInfo.activeSlot && slot.id === currentSlotInfo.nextSlot.id;
            return (
              <div
                key={slot.id}
                className={`card relative p-4 transition ${
                  isCurrent
                    ? "border-2 border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20"
                    : isNext
                      ? "border-violet/40 bg-violet/5"
                      : "opacity-85"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs font-bold text-violet">
                        {lang === "bn" ? slot.labelBn : slot.labelEn}
                      </span>
                      {isCurrent && (
                        <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white">
                          {lang === "bn" ? "এখন সক্রিয়" : "Active now"}
                        </span>
                      )}
                      {isNext && (
                        <span className="rounded-full bg-violet/15 px-2 py-0.5 text-[10px] font-bold text-violet">
                          {lang === "bn" ? "পরবর্তী স্লট" : "Next up"}
                        </span>
                      )}
                    </div>
                    <p className="font-num text-xs font-bold text-ink/70 mt-0.5">{slot.windowStr}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-surface-soft px-2 py-0.5 text-[10px] font-bold uppercase text-ink/60">
                    {slot.intensity === "walk_only" ? "Walk Only" : slot.intensity}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-ink/65">
                  {lang === "bn"
                    ? isFasting
                      ? slot.ramadanNoteBn
                      : slot.guidanceBn
                    : isFasting
                      ? slot.ramadanNoteEn
                      : slot.guidanceEn}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* No-Equipment & Small-Space Apartment Routines (FR-D-04) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <SectionLabel>
            {lang === "bn" ? "ছোট জায়গায় শব্দহীন শরীরচর্চা" : "Small-Space & No-Equipment Routines"}
          </SectionLabel>
          <span className="text-xs font-semibold text-ink/50">
            {lang === "bn" ? "ছাদ · বারান্দা · রুম" : "Rooftop · Balcony · Room"}
          </span>
        </div>

        <p className="text-xs text-ink/60">
          {lang === "bn"
            ? "প্রতিবেশীদের শব্দদূষণ বা স্থানস্বল্পতা ছাড়াই নিজের অ্যাপার্টমেন্ট বা ছাদে শরীর সচল রাখার সহজ প্ল্যান।"
            : "Zero equipment and low-noise routines tailored for city apartments, thin floors, and rooftop access."}
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          {SMALL_SPACE_ROUTINES.map((routine) => {
            const kcal = getSmallSpaceRoutineKcal(routine, profile?.weightKg ?? 65);
            const isExpanded = expandedRoutine === routine.id;
            const alreadyLogged = todayEntries.some(
              (e) => e.type === routine.activityType && e.minutes === routine.durationMin,
            );

            return (
              <div key={routine.id} className="card space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold">
                      {lang === "bn" ? routine.titleBn : routine.titleEn}
                    </h3>
                    <p className="text-xs text-ink/55">
                      📍 {lang === "bn" ? routine.locationBn : routine.locationEn} · {routine.durationMin} min
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-surface-soft px-2 py-0.5 text-[10px] font-bold text-ink/60">
                    {routine.noiseLevel === "silent"
                      ? lang === "bn"
                        ? "সম্পূর্ণ নীরব"
                        : "Silent"
                      : lang === "bn"
                        ? "অতি মৃদু শব্দ"
                        : "Ultra-quiet"}
                  </span>
                </div>

                <p className="text-xs text-ink/70">
                  {lang === "bn" ? routine.descriptionBn : routine.descriptionEn}
                </p>

                <div className="flex items-center justify-between rounded-tile bg-surface-soft px-3 py-2 text-xs">
                  <span className="text-ink/60 font-semibold">
                    ≈ {kcal.low}–{kcal.high} kcal net
                  </span>
                  <button
                    type="button"
                    onClick={() => setExpandedRoutine(isExpanded ? null : routine.id)}
                    className="inline-flex items-center gap-1 font-bold text-violet hover:underline"
                  >
                    <span>{isExpanded ? (lang === "bn" ? "সংক্ষেপ" : "Less") : (lang === "bn" ? "ধাপসমূহ" : "Steps")}</span>
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>

                {/* Collapsible Steps list */}
                {isExpanded && (
                  <div className="space-y-2 border-t border-border pt-2">
                    {routine.exercises.map((ex, idx) => (
                      <div key={idx} className="rounded-card bg-surface-soft/50 p-2.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold">
                            {idx + 1}. {lang === "bn" ? ex.nameBn : ex.nameEn}
                          </span>
                          <span className="font-num font-semibold text-violet">
                            {lang === "bn" ? ex.repsOrTimeBn : ex.repsOrTimeEn}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-ink/60">
                          💡 {lang === "bn" ? ex.tipBn : ex.tipEn}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Quick Log Button */}
                <button
                  type="button"
                  onClick={() => void log(routine.activityType, routine.durationMin)}
                  className={`flex h-9 w-full items-center justify-center gap-1.5 rounded-card text-xs font-bold transition ${
                    alreadyLogged
                      ? "border border-emerald-500/30 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                      : "bg-violet text-white hover:opacity-90 shadow-sm"
                  }`}
                >
                  <Sparkles size={13} />
                  <span>
                    {alreadyLogged
                      ? lang === "bn"
                        ? "লগ করা হয়েছে ✓"
                        : "Logged for today ✓"
                      : lang === "bn"
                        ? `এই সেশন লগ করুন (+${routine.durationMin} মিনিট)`
                        : `Log this workout (+${routine.durationMin} min)`}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <SectionLabel>{t("activity.foodPlan")}</SectionLabel>
        <div className="card p-5">
          <BarRangeChart
            days={budget.series.map((w) => formatDayName(w.date, lang))}
            values={budget.series.map((w) => w.kcal)}
            targets={budget.series.map((w) => w.target)}
            highlightToday
          />
          <Link href="/plan" className="mt-3 inline-flex min-h-11 items-center text-sm font-bold text-violet">
            {t("plan.spread")} →
          </Link>
        </div>
      </section>

      {/* Beginner Walk Progression (10→30 min) & National Physical Activity Pyramid (FR-D-08) */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <SectionLabel>
              {lang === "bn" ? "নতুনদের জন্য হাঁটার ধাপ (১০→৩০ মিনিট)" : "Beginner Walk Progression (10→30 min)"}
            </SectionLabel>
            <p className="mt-0.5 text-xs text-ink/60">
              {lang === "bn"
                ? "জাতীয় পুষ্টি নির্দেশিকা অনুযায়ী ৪ সপ্তাহের ধাপে ধাপে গড়ে তোলা অভ্যাস।"
                : "4-week step-up plan to comfortably reach the national 150 min/week aerobic goal."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowPyramid(!showPyramid)}
            className="text-xs font-bold text-violet underline hover:opacity-85"
          >
            {showPyramid
              ? lang === "bn" ? "পিরামিড লুকান ▲" : "Hide Pyramid ▲"
              : lang === "bn" ? "শারীরিক পরিশ্রম পিরামিড ▼" : "Activity Pyramid ▼"}
          </button>
        </div>

        <div className="card space-y-4 p-4">
          <div className="grid grid-cols-4 gap-2">
            {BEGINNER_WALK_PLAN.map((stage) => {
              const active = selectedWalkWeek === stage.week;
              return (
                <button
                  key={stage.week}
                  type="button"
                  onClick={() => setSelectedWalkWeek(stage.week)}
                  className={`rounded-card p-2 text-center transition ${
                    active
                      ? "bg-violet text-white font-bold shadow-xs"
                      : "bg-surface-soft hover:bg-peach text-ink/75 text-xs"
                  }`}
                >
                  <span className="block text-[11px] opacity-75">
                    {lang === "bn" ? `সপ্তাহ ${stage.week}` : `Wk ${stage.week}`}
                  </span>
                  <span className="block text-sm font-extrabold">{stage.dailyMinutes}m</span>
                </button>
              );
            })}
          </div>

          <div className="rounded-tile bg-surface-soft p-3.5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h4 className="text-sm font-bold">
                {lang === "bn" ? walkStage.focusBn : walkStage.focusEn}
              </h4>
              <span className="text-xs font-bold text-ink/60">
                {walkStage.frequencyDays} {lang === "bn" ? "দিন/সপ্তাহ" : "days/wk"} · {walkStage.weeklyGoalMinutes} {lang === "bn" ? "মি. লক্ষ্য" : "min goal"}
              </span>
            </div>
            <p className="mt-1.5 text-xs text-ink/65 leading-relaxed">
              💡 {lang === "bn" ? walkStage.tipBn : walkStage.tipEn}
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2.5">
              <span className="text-xs font-semibold text-ink/60">
                ≈ {walkKcal.low}–{walkKcal.high} kcal / session
              </span>
              <button
                type="button"
                onClick={() => void log("walk", walkStage.dailyMinutes)}
                className="inline-flex items-center gap-1.5 rounded-full bg-violet px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:opacity-90 transition"
              >
                <Footprints size={13} />
                <span>
                  {lang === "bn"
                    ? `আজকের ${walkStage.dailyMinutes} মি. হাঁটা লগ করুন`
                    : `Log today's ${walkStage.dailyMinutes}m walk`}
                </span>
              </button>
            </div>
          </div>

          {showPyramid && (
            <div className="space-y-2 border-t border-border pt-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-ink/70">
                  {lang === "bn"
                    ? "জাতীয় শারীরিক পরিশ্রম পিরামিড (২০২৫)"
                    : "National Physical Activity Pyramid (Aug 2025)"}
                </span>
                <span className="text-[10px] text-ink/45">National Nutrition Services / WHO</span>
              </div>
              <div className="space-y-2">
                {ACTIVITY_PYRAMID_TIERS.map((tier) => (
                  <div
                    key={tier.level}
                    className={`rounded-card p-3 border border-border/40 ${
                      tier.tone === "mint"
                        ? "bg-mint/15"
                        : tier.tone === "sky"
                          ? "bg-sky/15"
                          : tier.tone === "lilac"
                            ? "bg-lilac/15"
                            : "bg-peach/20"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold">
                        {lang === "bn" ? tier.titleBn : tier.titleEn}
                      </span>
                      <span className="rounded-full bg-surface/80 px-2 py-0.5 text-[10px] font-bold text-ink/70">
                        {lang === "bn" ? tier.frequencyBn : tier.frequencyEn}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-ink/70">
                      {(lang === "bn" ? tier.examplesBn : tier.examplesEn).join(" · ")}
                    </p>
                    <p className="mt-1 text-[11px] text-ink/50 italic">
                      {lang === "bn" ? tier.guidelineNoteBn : tier.guidelineNoteEn}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <section>
        <SectionLabel>{t("activity.habits")}</SectionLabel>
        <div className="grid gap-3 sm:grid-cols-2">
          <StatTile
            icon={Flame}
            label="Active days"
            value={week.activeDays}
            unit="/7"
            spark={budget.series.map((s) => (week.entries.some((e) => e.date === s.date) ? 1 : 0))}
          />
          <StatTile icon={ListTodo} label={t("activity.next")} value={nextActivitySlotLabel} />
        </div>
      </section>

      <NoticeCard
        tone="gentle"
        title="No public leaderboards"
        body="Your activity stays on your home plan only."
      />
    </div>
  );
}
