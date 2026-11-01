"use client";

import { useI18n } from "@/lib/i18n";
import { AreaChart, CalorieRing, PlateBalance } from "@/components/data/Charts";
import { HeroCard, PastelTile, StatTile } from "@/components/data/Cards";
import { Range, SectionLabel, SourceTag } from "@/components/data/Primitives";
import { NoticeCard, SafetyBanner } from "@/components/shell/Banners";
import { Button } from "@/components/forms/Forms";
import {
  DEMO_PROFILE,
  OVERSHOOT_BUDGET,
  TODAY_MEALS,
  TODAY_SUMMARY,
  WEEK,
} from "@/lib/mock";
import { formatDayName, formatDate } from "@/lib/format";
import { Droplet, Footprints, Leaf, UtensilsCrossed, Wheat } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function HomePage() {
  const { t, lang } = useI18n();
  const [overshootDismissed, setOvershootDismissed] = useState(false);
  const s = TODAY_SUMMARY;
  const mode = DEMO_PROFILE.safetyMode;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold md:text-3xl">
          {t("home.hello")}, {DEMO_PROFILE.name} 👋
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
                  targetLow={s.targetLow}
                  targetHigh={s.targetHigh}
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
                      {s.targetLow}–{s.targetHigh}
                    </span>
                  </div>
                  <AreaChart
                    data={WEEK.map((w) => w.kcal)}
                    target={WEEK[0].target}
                    labels={WEEK.map((w) => formatDayName(w.date, lang))}
                    highlightIndex={WEEK.length - 1}
                    animate
                    height={110}
                  />
                  <div className="mt-2 flex gap-1.5">
                    {WEEK.map((w, i) => (
                      <span
                        key={w.date}
                        className={`flex-1 rounded-full px-1 py-1 text-center text-[10px] font-bold ${
                          i === WEEK.length - 1 ? "bg-white text-violet" : "text-white/60"
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
            <StatTile icon={Droplet} label={t("home.water")} value={(s.waterMl / 1000).toFixed(1)} unit="L" spark={[0.4, 0.6, 0.8, 0.9, 1.0, 1.1, 1.2]} />
            <StatTile icon={Footprints} label={t("home.steps")} value={s.steps.toLocaleString()} spark={[2, 3, 4, 3, 5, 4, 4]} />
            <StatTile icon={Leaf} label={t("home.fibre")} value={s.fibreG} unit="g" spark={[12, 14, 15, 13, 16, 17, 18]} />
          </div>
        </div>
      )}

      {mode === "normal" && !overshootDismissed && (
        <NoticeCard
          tone="gentle"
          title={t("home.overshoot")}
          body="শুক্রবার একটু বেশি খাওয়া হয়েছে। চলুন, পরের ৪ দিনে ধীরে ধীরে সামলে নিই।"
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
            <div className="mt-3 flex flex-wrap gap-1.5">
              {Object.entries(s.micros).map(([k, v]) => (
                <span
                  key={k}
                  className="rounded-full bg-surface-soft px-2.5 py-1 text-[11px] font-semibold text-ink/60"
                >
                  {k}: {v}
                </span>
              ))}
            </div>
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
          label={t("home.logLunch")}
          sublabel={t("home.walk15")}
          onClick={() => {}}
        />
      </section>
    </div>
  );
}
