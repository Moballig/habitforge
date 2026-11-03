"use client";

import Link from "next/link";
import { useAction, useMutation, useQuery } from "convex/react";
import { useI18n } from "@/lib/i18n";
import { SemiGauge, BarRangeChart } from "@/components/data/Charts";
import { PastelTile, StatTile } from "@/components/data/Cards";
import { SectionLabel, Range, SourceTag } from "@/components/data/Primitives";
import { NoticeCard } from "@/components/shell/Banners";
import { Button } from "@/components/forms/Forms";
import { ACTIVITY_METS, DEFAULT_MINUTES, outdoorAdvice, stepsToMinutes } from "@/lib/engine";
import { todayISO } from "@/lib/foods/search";
import { formatDayName } from "@/lib/format";
import {
  Bike,
  Dumbbell,
  Footprints,
  House,
  Trophy,
  Waves,
  ListTodo,
  Flame,
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

export default function ActivityPage() {
  const { t, lang } = useI18n();
  const today = useSyncExternalStore(
    () => () => {},
    () => todayISO(),
    () => "",
  );
  const week = useQuery(api.activity.listWeek, today ? { today } : "skip");
  const budget = useQuery(api.budget.get, today ? { today } : "skip");
  const createActivity = useMutation(api.activity.create);
  const removeActivity = useMutation(api.activity.remove);
  const weather = useQuery(api.weather.get);
  const refreshWeather = useAction(api.weather.refresh);
  useEffect(() => {
    void refreshWeather();
  }, [refreshWeather]);
  const advice = outdoorAdvice(weather?.aqi ?? null, weather?.feelsC ?? null);
  const [steps, setSteps] = useState("");
  const [error, setError] = useState("");

  if (week === undefined || budget === undefined) {
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

  async function log(type: string) {
    setError("");
    const existing = todayEntries.find((e) => e.type === type);
    try {
      if (existing) {
        await removeActivity({ id: existing._id });
      } else {
        await createActivity({
          date: today,
          type,
          minutes: DEFAULT_MINUTES[type] ?? 30,
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
      <header>
        <h1 className="text-2xl font-extrabold md:text-3xl">{t("activity.title")}</h1>
        <p className="mt-1 text-xs font-semibold text-ink/50">{t("activity.privacyBadge")}</p>
      </header>

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
              title={t("activity.indoor")}
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

      <section>
        <SectionLabel>{t("activity.habits")}</SectionLabel>
        <div className="grid gap-3 sm:grid-cols-2">
          <StatTile
            icon={Flame}
            label="Active days"
            value={week.activeDays}
            unit="/7"
            spark={[1, 1, 0, 1, 1, 1, 0]}
          />
          <StatTile icon={ListTodo} label={t("activity.next")} value="Evening walk" />
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
