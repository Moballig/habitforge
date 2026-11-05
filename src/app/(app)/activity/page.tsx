"use client";

import Link from "next/link";
import { useAction, useMutation, useQuery } from "convex/react";
import { useI18n } from "@/lib/i18n";
import { SemiGauge } from "@/components/data/Charts";
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
import {
  Bike,
  ChevronDown,
  ChevronUp,
  CloudSun,
  Dumbbell,
  Footprints,
  House,
  Sparkles,
  Trophy,
  Waves,
  Flame,
  ListTodo,
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

const OUTDOOR_TYPES = new Set<string>(["walk", "cycle", "cricket"]);
function isOutdoor(type: string): boolean {
  return OUTDOOR_TYPES.has(type);
}

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
  const currentMinutes = useSyncExternalStore(
    () => () => {},
    () => {
      const d = new Date();
      return d.getHours() * 60 + d.getMinutes();
    },
    () => 12 * 60,
  );

  const [steps, setSteps] = useState("");
  const [error, setError] = useState("");
  const [ideaIndex, setIdeaIndex] = useState(0);

  // Accordion states
  const [routinesOpen, setRoutinesOpen] = useState(false);
  const [walkProgressionOpen, setWalkProgressionOpen] = useState(false);
  const [pyramidOpen, setPyramidOpen] = useState(false);
  const [gaugeOpen, setGaugeOpen] = useState(false);

  const [expandedRoutine, setExpandedRoutine] = useState<string | null>(null);
  const [selectedWalkWeek, setSelectedWalkWeek] = useState(1);

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

  // Right now recommendation logic
  const ideas = [
    {
      titleEn: currentSlotInfo.activeSlot
        ? `Right now: ${currentSlotInfo.activeSlot.labelEn}`
        : "Right now: 15-minute gentle walk",
      titleBn: currentSlotInfo.activeSlot
        ? `এই মুহূর্তে: ${currentSlotInfo.activeSlot.labelBn}`
        : "এই মুহূর্তে: ১৫ মিনিট স্বস্তিদায়ক হাঁটা",
      detailEn: currentSlotInfo.activeSlot
        ? isFasting
          ? currentSlotInfo.activeSlot.ramadanNoteEn
          : currentSlotInfo.activeSlot.guidanceEn
        : "Good time for a light brisk walk to stay active without fatigue.",
      detailBn: currentSlotInfo.activeSlot
        ? isFasting
          ? currentSlotInfo.activeSlot.ramadanNoteBn
          : currentSlotInfo.activeSlot.guidanceBn
        : "অতিরিক্ত ক্লান্তি ছাড়া সচল থাকতে একটি হালকা হাঁটার চমৎকার সময়।",
      type: "walk",
      duration: 15,
    },
    {
      titleEn: "Home Routine: 12-minute joint mobility & stretch",
      titleBn: "ঘরে শরীরচর্চা: ১২ মিনিট শরীর সচল রাখা ও স্ট্রেচ",
      detailEn: "Zero-equipment apartment routine. Low noise and gentle on thin floors.",
      detailBn: "কোনো সরঞ্জাম ছাড়া সম্পূর্ণ নীরব ঘরের শরীরচর্চা।",
      type: "home",
      duration: 12,
    },
    {
      titleEn: "Gentle Evening Yoga & Breathing",
      titleBn: "সন্ধ্যার শান্ত যোগাসন ও শ্বাস-প্রশ্বাস",
      detailEn: "Relaxes muscles after dinner and promotes peaceful sleep.",
      detailBn: "রাতের খাবারের পর পেশী শিথিল করে ও গভীর ঘুমে সাহায্য করে।",
      type: "yoga",
      duration: 15,
    },
  ];

  const currentIdea = ideas[ideaIndex % ideas.length]!;
  const ideaLogged = todayEntries.some((e) => e.type === currentIdea.type);

  return (
    <div className="space-y-5">
      {/* Header with Quiet "Home workouts only" Filter Chip */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink md:text-3xl">{t("activity.title")}</h1>
          <p className="mt-0.5 text-xs text-ink/50">{t("activity.privacyBadge")}</p>
        </div>

        {/* Quiet Filter Chip (No header badge) */}
        <button
          type="button"
          onClick={() => void setWomenPrivacy({ enabled: !profile?.womenFriendlyPrivacy })}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition border ${
            profile?.womenFriendlyPrivacy
              ? "bg-violet/10 text-violet border-violet/30"
              : "bg-surface-soft text-ink/65 border-border hover:bg-surface-soft/80"
          }`}
          title="Home workouts only mode"
        >
          <span>{lang === "bn" ? "হোম ওয়ার্কআউট শুধু" : "Home workouts only"}</span>
          <span className="text-[10px] font-bold opacity-60">
            {profile?.womenFriendlyPrivacy ? (lang === "bn" ? "চালু" : "ON") : (lang === "bn" ? "বন্ধ" : "OFF")}
          </span>
        </button>
      </header>

      {/* Static Weather Display (No Pulsing) */}
      {weather && (
        <div className="flex items-center gap-2 rounded-2xl bg-surface border border-border px-4 py-2.5 text-xs text-ink/75">
          <CloudSun size={17} className="text-sky-600 shrink-0" />
          <span className="font-medium">
            {advice.indoor
              ? lang === "bn"
                ? "বাতাসের মান বা গরমে আজ ঘরের ভেতরের হালকা ব্যায়াম উত্তম।"
                : "Air quality or heat suggests indoor movement today."
              : lang === "bn"
                ? "বাইরে হাঁটার জন্য চমৎকার আবহাওয়া।"
                : "Good weather for a walk outdoors."}
          </span>
          {weather.feelsC !== undefined && (
            <span className="font-num font-bold text-ink/50 ml-auto">
              {weather.feelsC}°C · {lang === "bn" ? regionCoords.nameBn : regionCoords.nameEn}
            </span>
          )}
        </div>
      )}

      {/* Right Now Card (Top context suggestion first) */}
      <section className="card p-5 space-y-3.5 border-violet/20 bg-gradient-to-br from-violet/5 via-surface to-surface">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-violet/15 px-2.5 py-0.5 text-[11px] font-bold text-violet">
              <Sparkles size={12} />
              {lang === "bn" ? "এই মুহূর্তের পরামর্শ" : "Right now"}
            </span>
            <h2 className="text-base font-extrabold text-ink sm:text-lg">
              {lang === "bn" ? currentIdea.titleBn : currentIdea.titleEn}
            </h2>
            <p className="text-xs text-ink/65 leading-relaxed">
              {lang === "bn" ? currentIdea.detailBn : currentIdea.detailEn}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="button"
            onClick={() => void log(currentIdea.type, currentIdea.duration)}
            className="flex h-11 items-center justify-center gap-2 rounded-full bg-violet px-6 text-sm font-bold text-white shadow-xs transition hover:opacity-90 active:scale-98"
          >
            <Footprints size={16} />
            <span>
              {ideaLogged
                ? lang === "bn"
                  ? "লগ হয়েছে ✓"
                  : "Logged ✓"
                : lang === "bn"
                  ? `শুরু করুন (+${currentIdea.duration} মিনিট)`
                  : `Start (+${currentIdea.duration} min)`}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setIdeaIndex(ideaIndex + 1)}
            className="text-xs font-bold text-violet underline hover:opacity-80"
          >
            {lang === "bn" ? "অন্য ধারণা দেখুন" : "Another idea"} →
          </button>
        </div>
      </section>

      {/* Prayer Times Strip (Current window highlighted) */}
      <section className="card p-4 space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-ink/60">
          <span>{lang === "bn" ? "নামাজের সময়সূচি" : "Prayer Windows"}</span>
          <span className="text-[11px] font-normal text-ink/50">
            {lang === "bn" ? regionCoords.nameBn : regionCoords.nameEn}
          </span>
        </div>
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
            <p className="text-[11px] font-semibold text-ink/50">{lang === "bn" ? "মাগরিব" : "Maghrib"}</p>
            <p className="font-num text-xs font-bold sm:text-sm text-amber-700 dark:text-amber-400">{prayerTimes.maghrib}</p>
          </div>
          <div className="px-1">
            <p className="text-[11px] font-semibold text-ink/50">{lang === "bn" ? "এশা" : "Isha"}</p>
            <p className="font-num text-xs font-bold sm:text-sm">{prayerTimes.isha}</p>
          </div>
        </div>
      </section>

      {/* Quick Exercise Logging Tiles */}
      <section className="space-y-3">
        <SectionLabel>{t("activity.exercise")}</SectionLabel>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {TILES.map((tile) => {
            const loggedToday = todayEntries.some((e) => e.type === tile.type);
            const Icon = tile.icon;
            const muted = advice.indoor && isOutdoor(tile.type);
            return (
              <div key={tile.type} className={muted ? "opacity-60" : undefined}>
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

        <div className="flex flex-wrap items-end gap-3 pt-2">
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
              className="mt-1 block w-36 rounded-tile border border-border bg-surface px-3 py-2 font-num tabular outline-none focus:border-violet text-sm"
            />
          </label>
          <Button onClick={() => void addSteps()}>{t("activity.stepsManual")}</Button>
          {error && (
            <span className="text-sm font-bold text-amber-600" role="alert">
              {error}
            </span>
          )}
        </div>
      </section>

      {/* Collapsible Accordion: Small-Space Apartment Routines */}
      <div className="card overflow-hidden">
        <button
          type="button"
          onClick={() => setRoutinesOpen(!routinesOpen)}
          className="flex w-full items-center justify-between p-4 text-left font-bold hover:bg-surface-soft transition"
        >
          <div className="flex items-center gap-2">
            <House size={17} className="text-ink/60" />
            <span className="text-sm text-ink">
              {lang === "bn" ? "ছোট জায়গায় শব্দহীন শরীরচর্চা" : "Small-Space & No-Equipment Routines"}
            </span>
          </div>
          {routinesOpen ? <ChevronUp size={18} className="text-ink/60" /> : <ChevronDown size={18} className="text-ink/60" />}
        </button>

        {routinesOpen && (
          <div className="border-t border-border p-4 space-y-3">
            <p className="text-xs text-ink/60">
              {lang === "bn"
                ? "শব্দহীন ও সরঞ্জামবিহীন রুটিন যা অ্যাপার্টমেন্ট, বারান্দা বা ছাদে সহজে করা যায়।"
                : "Zero equipment and low-noise routines tailored for apartments and balcony spaces."}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {SMALL_SPACE_ROUTINES.map((routine) => {
                const kcal = getSmallSpaceRoutineKcal(routine, profile?.weightKg ?? 65);
                const isExpanded = expandedRoutine === routine.id;
                const alreadyLogged = todayEntries.some(
                  (e) => e.type === routine.activityType && e.minutes === routine.durationMin,
                );

                return (
                  <div key={routine.id} className="tile p-3.5 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-xs font-bold text-ink">
                          {lang === "bn" ? routine.titleBn : routine.titleEn}
                        </h3>
                        <p className="text-[11px] text-ink/55">
                          {routine.durationMin} min · ≈ {kcal.low}–{kcal.high} kcal
                        </p>
                      </div>
                      <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] font-bold text-ink/60 border border-border">
                        {routine.noiseLevel === "silent" ? (lang === "bn" ? "নীরব" : "Silent") : (lang === "bn" ? "মৃদু" : "Quiet")}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setExpandedRoutine(isExpanded ? null : routine.id)}
                      className="text-[11px] font-bold text-violet underline"
                    >
                      {isExpanded ? (lang === "bn" ? "ধাপ লুকান" : "Hide steps") : (lang === "bn" ? "ধাপ দেখুন" : "View steps")}
                    </button>

                    {isExpanded && (
                      <div className="space-y-1.5 pt-1 text-xs border-t border-border/60">
                        {routine.exercises.map((ex, idx) => (
                          <div key={idx} className="flex justify-between text-[11px]">
                            <span>{idx + 1}. {lang === "bn" ? ex.nameBn : ex.nameEn}</span>
                            <span className="font-semibold text-violet">{lang === "bn" ? ex.repsOrTimeBn : ex.repsOrTimeEn}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => void log(routine.activityType, routine.durationMin)}
                      className="w-full mt-2 h-8 rounded-full bg-violet text-white text-xs font-bold hover:opacity-90 transition"
                    >
                      {alreadyLogged ? (lang === "bn" ? "লগ হয়েছে ✓" : "Logged ✓") : (lang === "bn" ? "লগ করুন" : "Log session")}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Collapsible Accordion: 10→30 min Walk Progression */}
      <div className="card overflow-hidden">
        <button
          type="button"
          onClick={() => setWalkProgressionOpen(!walkProgressionOpen)}
          className="flex w-full items-center justify-between p-4 text-left font-bold hover:bg-surface-soft transition"
        >
          <div className="flex items-center gap-2">
            <Footprints size={17} className="text-ink/60" />
            <span className="text-sm text-ink">
              {lang === "bn" ? "নতুনদের জন্য হাঁটার ধাপ (১০→৩০ মিনিট)" : "10→30 min Walk Progression"}
            </span>
          </div>
          {walkProgressionOpen ? <ChevronUp size={18} className="text-ink/60" /> : <ChevronDown size={18} className="text-ink/60" />}
        </button>

        {walkProgressionOpen && (
          <div className="border-t border-border p-4 space-y-3">
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
                        ? "bg-violet text-white font-bold"
                        : "bg-surface-soft text-ink/75 text-xs hover:bg-border"
                    }`}
                  >
                    <span className="block text-[10px] opacity-80">
                      {lang === "bn" ? `সপ্তাহ ${stage.week}` : `Wk ${stage.week}`}
                    </span>
                    <span className="block text-sm font-extrabold">{stage.dailyMinutes}m</span>
                  </button>
                );
              })}
            </div>

            <div className="tile p-3 text-xs space-y-1.5">
              <div className="flex justify-between items-center font-bold">
                <span>{lang === "bn" ? walkStage.focusBn : walkStage.focusEn}</span>
                <span className="text-ink/60">{walkStage.frequencyDays} {lang === "bn" ? "দিন/সপ্তাহ" : "days/wk"}</span>
              </div>
              <p className="text-ink/65 text-[11px]">{lang === "bn" ? walkStage.tipBn : walkStage.tipEn}</p>
              <button
                type="button"
                onClick={() => void log("walk", walkStage.dailyMinutes)}
                className="mt-2 h-8 rounded-full bg-violet text-white px-4 text-xs font-bold hover:opacity-90"
              >
                {lang === "bn" ? `${walkStage.dailyMinutes} মি. হাঁটা লগ করুন` : `Log ${walkStage.dailyMinutes}m walk`}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Collapsible Accordion: Activity Pyramid */}
      <div className="card overflow-hidden">
        <button
          type="button"
          onClick={() => setPyramidOpen(!pyramidOpen)}
          className="flex w-full items-center justify-between p-4 text-left font-bold hover:bg-surface-soft transition"
        >
          <div className="flex items-center gap-2">
            <Trophy size={17} className="text-ink/60" />
            <span className="text-sm text-ink">
              {lang === "bn" ? "জাতীয় শারীরিক পরিশ্রম পিরামিড" : "National Activity Pyramid"}
            </span>
          </div>
          {pyramidOpen ? <ChevronUp size={18} className="text-ink/60" /> : <ChevronDown size={18} className="text-ink/60" />}
        </button>

        {pyramidOpen && (
          <div className="border-t border-border p-4 space-y-2">
            {ACTIVITY_PYRAMID_TIERS.map((tier) => (
              <div key={tier.level} className="tile p-3 text-xs space-y-1">
                <div className="flex items-center justify-between font-bold">
                  <span>{lang === "bn" ? tier.titleBn : tier.titleEn}</span>
                  <span className="text-[10px] bg-surface px-2 py-0.5 rounded-full border border-border">
                    {lang === "bn" ? tier.frequencyBn : tier.frequencyEn}
                  </span>
                </div>
                <p className="text-ink/60 text-[11px]">
                  {(lang === "bn" ? tier.examplesBn : tier.examplesEn).join(" · ")}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Collapsible Accordion: 150-minute weekly progress gauge */}
      <div className="card overflow-hidden">
        <button
          type="button"
          onClick={() => setGaugeOpen(!gaugeOpen)}
          className="flex w-full items-center justify-between p-4 text-left font-bold hover:bg-surface-soft transition"
        >
          <div className="flex items-center gap-2">
            <Flame size={17} className="text-ink/60" />
            <span className="text-sm text-ink">
              {t("activity.weekMinutes")} ({week.weekMinutes} / {WEEK_GOAL} min)
            </span>
          </div>
          {gaugeOpen ? <ChevronUp size={18} className="text-ink/60" /> : <ChevronDown size={18} className="text-ink/60" />}
        </button>

        {gaugeOpen && (
          <div className="border-t border-border p-5 flex flex-col items-center gap-4 sm:flex-row sm:justify-around">
            <SemiGauge
              value={week.weekMinutes}
              max={Math.max(WEEK_GOAL, week.weekMinutes)}
              label={t("activity.weekMinutes")}
              valueLabel={`${week.weekMinutes} min`}
              size={170}
            />
            <div className="text-center sm:text-left space-y-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 text-xs font-bold">
                <Trophy size={13} />
                {week.weekMinutes >= WEEK_GOAL
                  ? t("activity.onTrack")
                  : `${Math.max(0, WEEK_GOAL - week.weekMinutes)} min to goal`}
              </span>
              <p className="text-xs text-ink/60">
                <Range low={week.weekNetKcalLow} high={week.weekNetKcalHigh} unit="kcal" />{" "}
                {t("activity.netKcal")}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
