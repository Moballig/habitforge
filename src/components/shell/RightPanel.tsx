"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { useQuery } from "convex/react";
import { useI18n } from "@/lib/i18n";
import { NoticeCard } from "@/components/shell/Banners";
import { api } from "../../../convex/_generated/api";
import { todayISO } from "@/lib/foods/search";
import { formatKcal } from "@/lib/format";

export default function RightPanel() {
  const { t } = useI18n();
  const [dismissed, setDismissed] = useState(false);

  const date = useSyncExternalStore(
    () => () => {},
    () => todayISO(),
    () => "",
  );

  const meals = useQuery(api.mealLogs.listByDate, date ? { date } : "skip");
  const profile = useQuery(api.profile.get, {});
  const budget = useQuery(api.budget.get, date ? { today: date } : "skip");

  const showOvershoot =
    budget &&
    budget.safetyMode === "normal" &&
    budget.overshootKcal > budget.toleranceKcal &&
    !dismissed;

  return (
    <div className="space-y-6">
      <section>
        <h2 className="section-dot text-sm font-bold">{t("home.mealsToday")}</h2>
        {meals === undefined ? (
          <div className="mt-3 h-16 animate-pulse rounded-card bg-surface-soft" />
        ) : meals.length === 0 ? (
          <p className="mt-3 text-xs text-ink/50">No meals logged yet today.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {meals.map((meal) => {
              const kcalL = meal.items.reduce((s, i) => s + i.kcalLow, 0);
              const kcalH = meal.items.reduce((s, i) => s + i.kcalHigh, 0);
              return (
                <li key={meal._id} className="tile flex items-center justify-between gap-2 p-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold capitalize">{meal.slot}</p>
                    <p className="truncate text-xs text-ink/50">
                      {meal.items.map((i) => i.nameEn).join(", ")}
                    </p>
                  </div>
                  <span className="font-num shrink-0 text-xs font-bold tabular text-ink/60">
                    {formatKcal(kcalL)}–{formatKcal(kcalH)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
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
            আজ প্রোটিন একটু কম থাকলে রাতে ডিম, মসুর ডাল বা দেশি মাছ যোগ করতে পারেন।
          </p>
          <Link href="/coach" className="mt-2 inline-block text-sm font-bold text-violet">
            Ask coach →
          </Link>
        </div>
      </section>

      {showOvershoot && (
        <NoticeCard
          tone="gentle"
          title={t("home.overshoot")}
          body={`Recent surplus of ~${Math.round(budget.overshootKcal)} kcal detected. Our 7-day rebalance engine spreads this comfortably.`}
          action={
            <Link href="/plan" className="text-sm font-bold underline">
              {t("plan.spread")}
            </Link>
          }
          onDismiss={() => setDismissed(true)}
        />
      )}

      <p className="text-[11px] leading-relaxed text-ink/40">
        User: {profile?.name ?? "Deshi Companion"} · {t("safety.notMedical")}
      </p>
    </div>
  );
}
