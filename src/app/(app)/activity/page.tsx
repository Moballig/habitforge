"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { SemiGauge, BarRangeChart } from "@/components/data/Charts";
import { PastelTile, StatTile } from "@/components/data/Cards";
import { SectionLabel, Range, SourceTag, Chip } from "@/components/data/Primitives";
import { NoticeCard } from "@/components/shell/Banners";
import { ACTIVITIES, WEEK } from "@/lib/mock";
import { formatDayName } from "@/lib/format";
import {
  Bike,
  Dumbbell,
  Footprints,
  House,
  Trophy,
  Waves,
  Droplet,
  ListTodo,
  Flame,
} from "lucide-react";
import { useState } from "react";

const WEEK_MINUTES = 185; // demo prop from engine in Wave 4
const WEEK_GOAL = 150;

export default function ActivityPage() {
  const { t, lang } = useI18n();
  const [logged, setLogged] = useState<string[]>([]);

  function log(type: string) {
    setLogged((l) => (l.includes(type) ? l : [...l, type]));
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold md:text-3xl">{t("activity.title")}</h1>
        <p className="mt-1 text-xs font-semibold text-ink/50">{t("activity.privacyBadge")}</p>
      </header>

      <section className="card flex flex-col items-center gap-6 p-5 sm:flex-row sm:justify-between">
        <SemiGauge
          value={WEEK_MINUTES}
          max={Math.max(WEEK_GOAL, WEEK_MINUTES)}
          label={t("activity.weekMinutes")}
          valueLabel={`${WEEK_MINUTES} min`}
          size={190}
        />
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <span className="inline-flex items-center gap-2 rounded-full bg-mint px-3 py-1 text-xs font-bold text-mint-ink">
            <Trophy size={13} /> {t("activity.onTrack")}
          </span>
          <p className="mt-3 text-sm text-ink/60">{t("activity.indoor")}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-1.5 sm:justify-start">
            {ACTIVITIES.map((a) => (
              <span key={a.id} className="rounded-full bg-surface-soft px-3 py-1.5 text-xs font-semibold">
                {a.type} · {a.minutes} min ·{" "}
                <Range low={a.netKcalLow} high={a.netKcalHigh} unit="" className="text-[11px]" />
              </span>
            ))}
            <SourceTag tag="measured" />
          </div>
        </div>
      </section>

      <section>
        <SectionLabel>{t("activity.exercise")}</SectionLabel>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <PastelTile tone="sky" icon={Footprints} label={t("activity.walk")} sublabel={logged.includes("walk") ? "✓ logged" : "+ log"} onClick={() => log("walk")} />
          <PastelTile tone="mint" icon={Bike} label={t("activity.cycle")} sublabel={logged.includes("cycle") ? "✓ logged" : "+ log"} onClick={() => log("cycle")} />
          <PastelTile tone="lilac" icon={Dumbbell} label={t("activity.homeWorkout")} sublabel={logged.includes("home") ? "✓ logged" : "+ log"} onClick={() => log("home")} />
          <PastelTile tone="peach" icon={Trophy} label={t("activity.cricket")} sublabel={logged.includes("cricket") ? "✓ logged" : "+ log"} onClick={() => log("cricket")} />
          <PastelTile tone="mint" icon={Waves} label={t("activity.yoga")} sublabel={logged.includes("yoga") ? "✓ logged" : "+ log"} onClick={() => log("yoga")} />
          <PastelTile tone="sky" icon={House} label={t("activity.chores")} sublabel={logged.includes("chores") ? "✓ logged" : "+ log"} onClick={() => log("chores")} />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Chip onClick={() => log("steps")}>{t("activity.stepsManual")} +</Chip>
          <Chip onClick={() => log("water")}>
            <Droplet size={13} className="mr-1 inline" /> {t("activity.water")}
          </Chip>
        </div>
      </section>

      <section>
        <SectionLabel>{t("activity.foodPlan")}</SectionLabel>
        <div className="card p-5">
          <BarRangeChart
            days={WEEK.map((w) => formatDayName(w.date, lang))}
            values={WEEK.map((w) => w.kcal)}
            targets={WEEK.map((w) => w.target)}
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
          <StatTile icon={Flame} label="Active days" value="5" unit="/7" spark={[1, 1, 0, 1, 1, 1, 0]} />
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
