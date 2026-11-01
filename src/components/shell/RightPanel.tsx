"use client";

import Link from "next/link";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { NoticeCard } from "@/components/shell/Banners";
import { TODAY_MEALS, DEMO_PROFILE } from "@/lib/mock";

export default function RightPanel() {
  const { t } = useI18n();
  const [dismissed, setDismissed] = useState(false);

  return (
    <div className="space-y-6">
      <section>
        <h2 className="section-dot text-sm font-bold">{t("home.mealsToday")}</h2>
        <ul className="mt-3 space-y-2">
          {TODAY_MEALS.map((meal) => {
            const kcal = meal.items.reduce((s, i) => s + i.kcalLow, 0);
            const kcalH = meal.items.reduce((s, i) => s + i.kcalHigh, 0);
            return (
              <li key={meal.id} className="tile flex items-center justify-between gap-2 p-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold capitalize">{meal.slot}</p>
                  <p className="truncate text-xs text-ink/50">
                    {meal.items.map((i) => i.nameEn).join(", ")}
                  </p>
                </div>
                <span className="font-num shrink-0 text-xs font-bold tabular text-ink/60">
                  {Math.round(kcal)}–{Math.round(kcalH)}
                </span>
              </li>
            );
          })}
        </ul>
        <Link
          href="/log"
          className="mt-3 inline-flex min-h-11 items-center text-sm font-bold text-violet"
        >
          + {t("home.logMeal")}
        </Link>
      </section>

      <section>
        <h2 className="section-dot text-sm font-bold">{t("home.coachNudge")}</h2>
        <div className="tile mt-3 p-4">
          <p className="text-sm leading-relaxed text-ink/70">
            আজ প্রোটিন একটু কম। রাতে ডিম বা ছোট মাছ যোগ করলে ভালো।
          </p>
          <Link href="/coach" className="mt-2 inline-block text-sm font-bold text-violet">
            Ask coach →
          </Link>
        </div>
      </section>

      {!dismissed && (
        <NoticeCard
          tone="gentle"
          title={t("home.overshoot")}
          body="শুক্রবার একটু বেশি খাওয়া হয়েছে। চলুন, পরের ৪ দিনে ধীরে ধীরে সামলে নিই।"
          action={
            <Link href="/plan" className="text-sm font-bold underline">
              {t("plan.spread")}
            </Link>
          }
          onDismiss={() => setDismissed(true)}
        />
      )}

      <p className="text-[11px] leading-relaxed text-ink/40">
        Demo user: {DEMO_PROFILE.name} · {t("safety.notMedical")}
      </p>
    </div>
  );
}
