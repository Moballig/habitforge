"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { useI18n } from "@/lib/i18n";
import { BarRangeChart } from "@/components/data/Charts";
import { SectionLabel, Range, SourceTag } from "@/components/data/Primitives";
import { NoticeCard, SafetyBanner } from "@/components/shell/Banners";
import { Button } from "@/components/forms/Forms";
import { todayISO } from "@/lib/foods/search";
import { formatDayName, formatShortDate } from "@/lib/format";
import { Footprints, Utensils, HeartPulse, CalendarClock, Sparkles } from "lucide-react";
import { useState, useSyncExternalStore } from "react";
import { api } from "../../../../convex/_generated/api";

export default function PlanPage() {
  const { t, lang } = useI18n();
  // Client-only date; server snapshot is "" so prerender never calls new Date()
  const today = useSyncExternalStore(
    () => () => {},
    () => todayISO(),
    () => "",
  );
  const budget = useQuery(api.budget.get, today ? { today } : "skip");
  const [extraMeals, setExtraMeals] = useState(1); // meal units of 600 kcal
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
        <span className="rounded-full bg-peach px-3 py-1 text-xs font-bold text-peach-ink">
          {budget.overshootKcal} kcal over
        </span>
      </header>

      <SafetyBanner mode={mode} />

      {mode === "restricted" ? (
        <NoticeCard tone="info" title={t("plan.restricted")} body="Maintenance guidance only." />
      ) : (
        <>
          <section className="card p-5">
            <SectionLabel>{t("plan.budget")}</SectionLabel>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="font-num text-3xl font-extrabold tabular">
                  {budget.weeklyUsed.toLocaleString()}
                </p>
                <p className="text-sm text-ink/50">
                  / {budget.weeklyBudget.toLocaleString()} kcal
                </p>
              </div>
              <p className="text-right text-sm font-semibold text-ink/60">
                {t("plan.used")}: {Math.round(usedPct)}%
              </p>
            </div>
            <div className="mt-3 h-3 rounded-full bg-surface-soft">
              <div
                className="h-3 rounded-full bg-gradient-to-r from-violet to-coral"
                style={{ width: `${usedPct}%` }}
              />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Meta label={t("plan.window")} value={`${budget.windowDays} d`} icon={CalendarClock} />
              <Meta label={t("plan.floor")} value={`${budget.floorKcal}`} icon={HeartPulse} />
              <Meta label={t("plan.cap")} value={`${budget.activityCapNet} kcal`} icon={Footprints} />
              <Meta label="Intake share" value={`${Math.round(budget.intakeShare * 100)}%`} icon={Utensils} />
            </div>
          </section>

          <section>
            <SectionLabel>{t("plan.spread")}</SectionLabel>
            {budget.plan.length === 0 ? (
              <NoticeCard
                tone="gentle"
                title={t("plan.noPlan")}
                body={`${t("plan.used")}: ${Math.round(usedPct)}% · ${t("plan.budget")}`}
              />
            ) : (
              <>
            <p className="mb-3 text-sm text-ink/60">{t("plan.split")}</p>
            <ul className="space-y-2">
              {budget.plan.map((day) => (
                <li key={day.date} className="tile flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <p className="font-bold">
                      {formatDayName(day.date, lang)}{" "}
                      <span className="text-xs font-medium text-ink/50">
                        {formatShortDate(day.date, lang)}
                      </span>
                    </p>
                    <p className="mt-0.5 text-sm text-ink/60">
                      trim <Range low={day.trimKcal} high={day.trimKcal} unit="kcal" /> ·{" "}
                      <span className="inline-flex items-center gap-1">
                        <Footprints size={13} /> {day.activityMin} min (~{day.activityKcal} kcal)
                      </span>
                    </p>
                    {day.floorNote && (
                      <p className="mt-1 text-xs text-ink/45">{t("plan.floor")}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <SourceTag tag="estimated" />
                    <span className="rounded-full bg-mint px-2.5 py-1 text-[11px] font-bold text-mint-ink">
                      safe
                    </span>
                  </div>
                </li>
              ))}
            </ul>
              </>
            )}
          </section>

          <section>
            <SectionLabel>{t("plan.whatIf")}</SectionLabel>
            <div className="card space-y-4 p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-ink/60">
                  Extra meals this week
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="h-10 w-10 rounded-full bg-surface-soft font-bold"
                    onClick={() => setExtraMeals(Math.max(0, extraMeals - 1))}
                    aria-label="Less"
                  >
                    −
                  </button>
                  <span className="font-num w-6 text-center font-extrabold tabular">{extraMeals}</span>
                  <button
                    type="button"
                    className="h-10 w-10 rounded-full bg-surface-soft font-bold"
                    onClick={() => setExtraMeals(Math.min(5, extraMeals + 1))}
                    aria-label="More"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-tile bg-peach px-4 py-3 text-sm font-semibold text-peach-ink">
                <Sparkles size={16} />
                {extraMeals === 0
                  ? `≈ +0 kcal · ${t("plan.noPlan")}`
                  : !sim
                    ? "…"
                    : sim.blocked
                      ? "≈ +600 kcal · maintenance only in this mode"
                      : sim.plan.length === 0
                        ? `≈ +${extraMeals * 600} kcal · within the weekly budget — no plan needed`
                        : `≈ +${extraMeals * 600} kcal · ${sim.overshootKcal} kcal over → trim ${sim.plan[0]!.trimKcal} kcal/day over ${sim.plan.length} days`}
              </div>
              <p className="text-xs text-ink/50">
                Never below the floor ({budget.floorKcal} kcal) and never beyond the activity cap.
              </p>
            </div>
          </section>

          <section>
            <SectionLabel>{t("plan.reverse")}</SectionLabel>
            <div className="card p-5">
              <p className="text-sm text-ink/60">
                {t("plan.adaptive")} · {t("plan.improving")}
              </p>
              <div className="mt-4">
                <BarRangeChart
                  days={budget.series.map((w) => formatDayName(w.date, lang))}
                  values={budget.series.map((w) => w.kcal)}
                  targets={budget.series.map((w) => w.target)}
                  highlightToday
                />
              </div>
            </div>
          </section>

          <div className="flex flex-wrap gap-3">
            <Link href="/activity">
              <Button variant="secondary">{t("activity.title")}</Button>
            </Link>
            <Link href="/log">
              <Button>{t("home.logMeal")}</Button>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

function Meta({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Footprints;
}) {
  return (
    <div className="rounded-tile bg-surface-soft px-3 py-2.5">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold text-ink/50">
        <Icon size={12} /> {label}
      </p>
      <p className="font-num mt-0.5 text-sm font-extrabold tabular">{value}</p>
    </div>
  );
}
