"use client";

import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { useState, useSyncExternalStore } from "react";
import { useI18n } from "@/lib/i18n";
import { AreaChart } from "@/components/data/Charts";
import { SectionLabel, SourceTag } from "@/components/data/Primitives";
import { NoticeCard } from "@/components/shell/Banners";
import { Button } from "@/components/forms/Forms";
import { todayISO } from "@/lib/foods/search";
import { formatShortDate } from "@/lib/format";
import {
  Scale,
  TrendingUp,
  Coins,
  Moon,
  Sparkles,
  Droplets,
  CheckCircle2,
} from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import {
  getCheapestProteinSources,
  calculateProteinDailyCost,
} from "@/lib/engine/proteinCost";
import { generateFastingPlan } from "@/lib/engine/ramadan";

const NOISE_NOTES = [
  { value: "none", labelEn: "Standard day", labelBn: "স্বাভাবিক দিন", icon: "⚖️" },
  { value: "eid_feast", labelEn: "Eid / Dawat Feast", labelBn: "ঈদ / দাওয়াত", icon: "🍖" },
  { value: "salty_meal", labelEn: "High-sodium meal", labelBn: "লবণাক্ত খাবার", icon: "🧂" },
  { value: "cycle", labelEn: "Menstrual cycle / water", labelBn: "মাসিক চক্র / পানি জমা", icon: "🌸" },
  { value: "travel", labelEn: "Travel / disrupted sleep", labelBn: "ভ্রমণ / অনিয়ম", icon: "✈️" },
  { value: "illness", labelEn: "Illness / medications", labelBn: "অসুস্থতা / ওষুধ", icon: "💊" },
] as const;

export default function InsightsPage() {
  const { t, lang } = useI18n();
  const today = useSyncExternalStore(
    () => () => {},
    () => todayISO(),
    () => "",
  );
  const data = useQuery(api.weights.trend, today ? { today } : "skip");
  const addWeighIn = useMutation(api.weights.add);
  const [weight, setWeight] = useState("");
  const [note, setNote] = useState<string>("none");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // Wave 6 UI filters & states
  const [proteinCategory, setProteinCategory] = useState<
    "all" | "staple_dal" | "fish" | "egg_poultry" | "soy_seeds"
  >("all");
  const [targetProtein, setTargetProtein] = useState<number>(60);
  const [isRamadanActive, setIsRamadanActive] = useState<boolean>(false);

  if (data === undefined) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-extrabold md:text-3xl">{t("nav.insights")}</h1>
        <div className="tile h-40 animate-pulse" aria-busy="true" aria-label="Loading insights" />
      </div>
    );
  }

  if (data === null) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-extrabold md:text-3xl">{t("nav.insights")}</h1>
        <NoticeCard
          tone="info"
          title={t("states.empty")}
          body="Set up your profile to see insights."
        />
        <Link href="/onboarding">
          <Button>{t("home.setup")}</Button>
        </Link>
      </div>
    );
  }

  const a = data.adaptive;
  const statusLabel =
    a.status === "formula"
      ? t("insights.statusFormula")
      : a.status === "settled"
        ? t("insights.statusSettled")
        : t("plan.improving");
  const statusTone =
    a.status === "settled"
      ? "bg-accent/15 text-accent-ink"
      : a.status === "improving"
        ? "bg-primary/15 text-primary"
        : "bg-surface-soft text-ink/60";

  const chartData = data.weighIns.map((w) => w.weightKg);
  const chartSmoothed = data.weighIns.map((w) => w.smoothedKg);
  const chartLabels = data.weighIns.map((w) => formatShortDate(w.date, lang));

  const recentNotes = data.weighIns
    .filter((w) => w.note && w.note !== "none")
    .map((w) => {
      const match = NOISE_NOTES.find((n) => n.value === w.note);
      return {
        date: w.date,
        tagLabel: match
          ? lang === "bn"
            ? `${match.icon} ${match.labelBn}`
            : `${match.icon} ${match.labelEn}`
          : w.note,
      };
    });

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const parsed = parseFloat(weight);
    if (!parsed || parsed < 30 || parsed > 300) {
      setError(t("insights.weightInvalid"));
      return;
    }
    await addWeighIn({
      date: today,
      weightKg: Math.round(parsed * 10) / 10,
      note: note !== "none" ? note : undefined,
    });
    setWeight("");
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  // Wave 6 Data derivations
  const proteinList = getCheapestProteinSources(
    proteinCategory === "all" ? undefined : proteinCategory,
  );
  const proteinCostBudget = calculateProteinDailyCost(targetProtein);
  const fastingPlan = generateFastingPlan(data.formulaTdee || 2000);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold md:text-3xl">{t("nav.insights")}</h1>
        <p className="mt-1 text-sm text-ink/60">{t("insights.subtitle")}</p>
      </div>

      {/* ─── Wave 6: Cheap-Protein Finder & Taka Economics (FR-G-05) ─── */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <SectionLabel>
              <span className="flex items-center gap-1.5 text-accent-ink">
                <Coins size={14} />
                {lang === "bn" ? "প্রোটিন ইকোনমিক্স ও সাশ্রয়ী তালিকা" : "Cheap-Protein Finder (Protein per ৳100)"}
              </span>
            </SectionLabel>
            <p className="text-xs text-ink/60">
              {lang === "bn"
                ? "ডাল, ডিম, মাছ ও সয়াবিনের বাজারদর (WFP/TCB ২০২৬) অনুযায়ী প্রতি ১০০ টাকায় কত গ্রাম প্রোটিন পাওয়া যায়।"
                : "Real Dhaka/National market prices benchmarked against FCTB protein density. Ranked by value."}
            </p>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-surface-soft p-1 text-xs font-semibold">
            {(
              [
                ["all", lang === "bn" ? "সকল" : "All"],
                ["staple_dal", lang === "bn" ? "ডাল" : "Dal"],
                ["fish", lang === "bn" ? "মাছ" : "Fish"],
                ["egg_poultry", lang === "bn" ? "ডিম/মুরগি" : "Egg/Chicken"],
                ["soy_seeds", lang === "bn" ? "সয়াবিন" : "Soy"],
              ] as const
            ).map(([cat, label]) => (
              <button
                key={cat}
                type="button"
                onClick={() => setProteinCategory(cat)}
                className={`rounded-full px-2.5 py-1 transition-all ${
                  proteinCategory === cat
                    ? "bg-white text-ink shadow-sm dark:bg-zinc-800"
                    : "text-ink/50 hover:text-ink"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Daily Protein Cost Calculator */}
        <div className="card p-4 bg-gradient-to-br from-surface to-surface-soft border border-accent/20">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-accent-ink">
                {lang === "bn" ? "দৈনিক প্রোটিন বাজেট হিসেব" : "Daily Protein Cost Calculator"}
              </p>
              <p className="mt-0.5 text-sm font-semibold text-ink/80">
                {lang === "bn"
                  ? `আপনার লক্ষ্য: ${targetProtein} গ্রাম প্রোটিন প্রতিদিন`
                  : `Your Target: ${targetProtein}g protein/day`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {[45, 60, 75, 90].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setTargetProtein(g)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                    targetProtein === g
                      ? "bg-accent text-white"
                      : "bg-surface-soft text-ink/60 hover:text-ink"
                  }`}
                >
                  {g}g
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-tile bg-white/70 p-2.5 dark:bg-zinc-900/50">
              <span className="text-[10px] font-bold text-accent-ink">
                {lang === "bn" ? "সাশ্রয়ী ডাল+সয়া মিক্স" : "Economy (Dal + Soy)"}
              </span>
              <p className="font-num text-base font-extrabold text-ink">
                ৳{proteinCostBudget.lowCostBDT}
                <span className="text-[10px] font-normal text-ink/50">/day</span>
              </p>
            </div>
            <div className="rounded-tile bg-white/70 p-2.5 dark:bg-zinc-900/50">
              <span className="text-[10px] font-bold text-primary">
                {lang === "bn" ? "ডিম + পাঙ্গাশ + ডাল" : "Balanced (Egg+Fish+Dal)"}
              </span>
              <p className="font-num text-base font-extrabold text-ink">
                ৳{proteinCostBudget.balancedCostBDT}
                <span className="text-[10px] font-normal text-ink/50">/day</span>
              </p>
            </div>
            <div className="rounded-tile bg-white/70 p-2.5 dark:bg-zinc-900/50">
              <span className="text-[10px] font-bold text-ink/60">
                {lang === "bn" ? "রেগুলার মাংস/ইলিশ" : "Premium (Meat/Hilsa)"}
              </span>
              <p className="font-num text-base font-extrabold text-ink">
                ৳{proteinCostBudget.premiumCostBDT}
                <span className="text-[10px] font-normal text-ink/50">/day</span>
              </p>
            </div>
          </div>
        </div>

        {/* Top Protein Items Grid */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {proteinList.slice(0, 6).map((item, idx) => (
            <div
              key={item.id}
              className="card relative flex flex-col justify-between p-4 transition-all hover:border-accent/40"
            >
              {idx === 0 && (
                <span className="absolute -top-2 right-3 rounded-full bg-accent px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-sm">
                  {lang === "bn" ? "শীর্ষ মান" : "Best Value"}
                </span>
              )}
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-ink">
                    {lang === "bn" ? item.nameBn : item.nameEn}
                  </h3>
                  <span className="rounded-md bg-surface-soft px-1.5 py-0.5 text-[11px] font-bold text-ink/70">
                    ৳{item.pricePerKgBDT}/kg
                  </span>
                </div>
                <p className="mt-1 text-xs text-ink/50">
                  {item.proteinPer100g}g protein / 100g ({item.kcalPer100g} kcal)
                </p>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-ink/5 pt-2.5 text-xs">
                <div>
                  <span className="text-[10px] text-ink/50">
                    {lang === "bn" ? "১০০ টাকায় প্রোটিন" : "Protein / ৳100"}
                  </span>
                  <p className="font-num text-sm font-extrabold text-accent-ink">
                    {item.proteinPer100BDT}g
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-ink/50">
                    {lang === "bn" ? "২০ গ্রাম প্রোটিন খরচ" : "Cost for 20g Prot"}
                  </span>
                  <p className="font-num text-sm font-extrabold text-ink">
                    ৳{item.costPer20gProteinBDT}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Wave 6: Ramadan & Fasting Planner (FR-G-03) ─── */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <SectionLabel>
              <span className="flex items-center gap-1.5 text-primary">
                <Moon size={14} />
                {lang === "bn" ? "রমজান ও রোজা পুষ্টি গাইড" : "Ramadan & Fasting Nutrition Mode"}
              </span>
            </SectionLabel>
            <p className="text-xs text-ink/60">
              {lang === "bn"
                ? "রোজায় পানিশূন্যতা ও দুর্বলতা রোধে সেহরি-ইফতার ক্যালরি ও পানি বণ্টন। কোনো ঘাটতি চাপিয়ে দেওয়া হয় না।"
                : "Safe hydration and nutrient pacing. Deficit is automatically disabled during fasting."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsRamadanActive(!isRamadanActive)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-all ${
              isRamadanActive
                ? "bg-primary text-white shadow-sm"
                : "bg-surface-soft text-ink/70 hover:bg-surface-soft/80"
            }`}
          >
            <Sparkles size={13} />
            {isRamadanActive
              ? lang === "bn" ? "রোজা মোড চালু" : "Fasting Active"
              : lang === "bn" ? "রোজা মোড দেখুন" : "View Fasting Mode"}
          </button>
        </div>

        {isRamadanActive && (
          <div className="card space-y-4 p-5 bg-gradient-to-br from-surface to-primary/5 border border-primary/20 animate-fade-in">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ink/5 pb-3">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-2.5 text-primary">
                  <Droplets size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-ink">
                    {lang === "bn" ? "দৈনিক হাইড্রেশন রুটিন (৯ গ্লাস পানি)" : "Paced Hydration Routine (9 Glasses)"}
                  </h3>
                  <p className="text-xs text-ink/60">
                    {lang === "bn"
                      ? "ইফতার থেকে সেহরি পর্যন্ত নির্দিষ্ট বিরতিতে পানি পান করে ক্লান্তি ও মাথাব্যথা রোধ করুন।"
                      : "Evenly distributed between Iftar and Sehri to prevent dehydration."}
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-extrabold text-primary">
                {lang === "bn" ? "০ ক্যালরি ডেফিসিট গার্ডরেইল" : "Zero Deficit Guardrail"}
              </span>
            </div>

            {/* Hydration Slots */}
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {fastingPlan.hydrationSlots.map((slot, i) => (
                <div
                  key={i}
                  className="rounded-tile bg-white/70 p-3 text-xs dark:bg-zinc-900/50"
                >
                  <div className="flex items-center justify-between font-bold text-ink">
                    <span>{lang === "bn" ? slot.timeLabelBn : slot.timeLabelEn}</span>
                    <span className="text-primary font-num">{slot.targetGlasses} 🥛</span>
                  </div>
                  <p className="mt-1 text-[11px] text-ink/60 leading-relaxed">
                    {slot.recommended}
                  </p>
                </div>
              ))}
            </div>

            {/* Meal Pacing Guidelines */}
            <div className="space-y-2 pt-2">
              <p className="text-xs font-bold text-ink/70 uppercase tracking-wide">
                {lang === "bn" ? "খাবারের সঠিক বণ্টন ও সংযম" : "Meal Energy Pacing & Moderation"}
              </p>
              <div className="grid gap-3 md:grid-cols-3">
                {fastingPlan.mealPacing.map((meal, i) => (
                  <div
                    key={i}
                    className="rounded-tile bg-white/60 p-3 text-xs dark:bg-zinc-900/40 border border-ink/5"
                  >
                    <div className="flex items-center justify-between font-extrabold text-ink">
                      <span className="capitalize">
                        {meal.slot === "iftar"
                          ? lang === "bn" ? "ইফতার (৩০%)" : "Iftar (30%)"
                          : meal.slot === "post_prayer_dinner"
                            ? lang === "bn" ? "তারাবির পর রাতের খাবার (৩৫%)" : "Dinner (35%)"
                            : lang === "bn" ? "সেহরি (৩৫%)" : "Sehri (35%)"}
                      </span>
                      <CheckCircle2 size={13} className="text-accent-ink" />
                    </div>
                    <p className="mt-1.5 text-ink/80 leading-normal">
                      {lang === "bn" ? meal.recommendationBn : meal.recommendationEn}
                    </p>
                    <p className="mt-2 text-[10px] text-red-500/80">
                      <strong>{lang === "bn" ? "সীমিত রাখুন: " : "Limit: "}</strong>
                      {lang === "bn" ? meal.itemsToLimitBn : meal.itemsToLimitEn}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ─── Weigh-In & Adaptive TDEE Section (FR-E-10, FR-ATDEE-*) ─── */}
      <section className="space-y-4">
        <SectionLabel>{t("insights.weighIn")}</SectionLabel>
        <form onSubmit={handleAdd} className="card space-y-3 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="number"
              step="0.1"
              min="30"
              max="300"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder={t("insights.weightPlaceholder")}
              className="input w-32 font-num text-sm"
              aria-label={t("insights.weightPlaceholder")}
            />
            <span className="text-xs font-semibold text-ink/50">kg</span>

            <select
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="input min-w-44 text-xs font-medium"
              aria-label="Weigh-in Context Note"
            >
              {NOISE_NOTES.map((n) => (
                <option key={n.value} value={n.value}>
                  {n.icon} {lang === "bn" ? n.labelBn : n.labelEn}
                </option>
              ))}
            </select>

            <Button type="submit">{t("insights.logWeight")}</Button>
            {saved && (
              <span className="text-xs font-bold text-accent-ink" role="status">
                ✓ {t("insights.logged")}
              </span>
            )}
            {error && (
              <span className="text-xs font-bold text-red-600" role="alert">
                {error}
              </span>
            )}
          </div>
          <p className="text-[11px] text-ink/50">
            {lang === "bn"
              ? "💡 বিশেষ দিনের নোট (যেমন দাওয়াত বা লবণাক্ত খাবার) দিলে সাময়িক পানি জমার কারণে স্কেল বিভ্রান্তি এড়ানো যায়।"
              : "💡 Tagging events (e.g. feast, high salt) prevents panic from temporary water weight spikes."}
          </p>
        </form>

        {data.weighIns.length > 0 && (
          <div className="card space-y-3 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-3 font-semibold">
                <span className="flex items-center gap-1.5 text-ink/70">
                  <span className="inline-block h-2 w-3 rounded-full bg-white dark:bg-zinc-300 border border-ink/20" />
                  {lang === "bn" ? "স্কেলের ওজন" : "Raw scale"}
                </span>
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <span className="inline-block h-0.5 w-3 border-b-2 border-dashed border-emerald-500" />
                  {lang === "bn" ? "৭ দিনের স্মুথড ট্রেন্ড" : "7-day smoothed trend"}
                </span>
              </div>
              <span className="text-[11px] text-ink/40">FR-E-10 · Noise smoothed</span>
            </div>

            <AreaChart
              data={chartData}
              secondaryData={chartSmoothed}
              labels={chartLabels}
              animate
              height={140}
            />

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/40 pt-2 text-xs text-ink/50">
              <p className="flex items-center gap-2">
                <TrendingUp size={13} />
                {data.weighIns[0]!.weightKg.toFixed(1)} →{" "}
                {data.weighIns.at(-1)!.weightKg.toFixed(1)} kg ·{" "}
                {data.weightDeltaKg > 0 ? "+" : ""}
                {data.weightDeltaKg} kg / {data.days} d
                <SourceTag tag="measured" />
              </p>
              <span className="font-num font-semibold text-emerald-600 dark:text-emerald-400">
                {lang === "bn" ? "বর্তমান স্মুথড: " : "Latest trend: "}
                {chartSmoothed.at(-1)?.toFixed(1)} kg
              </span>
            </div>

            {recentNotes.length > 0 && (
              <div className="rounded-tile bg-surface-soft p-3 text-xs text-ink/75 space-y-1.5">
                <span className="font-bold text-[11px] uppercase tracking-wider text-ink/60">
                  {lang === "bn" ? "চিহ্নিত কারণসমূহ (স্বাভাবিক ওজন তারতম্য)" : "Tagged Context (Normal Water Shifts)"}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {recentNotes.map((entry, idx) => (
                    <span key={idx} className="rounded-full bg-peach/40 px-2 py-0.5 text-[11px] font-semibold text-ink/80">
                      {formatShortDate(entry.date, lang)}: {entry.tagLabel}
                    </span>
                  ))}
                </div>
                <p className="text-[11px] text-ink/50 leading-relaxed">
                  {lang === "bn"
                    ? "💡 দাওয়াত, লবণ বা চক্রের পর স্কেলের ১-২ কেজি বৃদ্ধি চর্বি নয়, বরং অস্থায়ী গ্লাইকোজেন ও পানির সঞ্চয়।"
                    : "💡 1–2 kg weight spikes after feasts, salty meals, or during cycles reflect fluid retention, not fat gain."}
                </p>
              </div>
            )}
          </div>
        )}
      </section>

      <section>
        <SectionLabel>{t("plan.adaptive")}</SectionLabel>
        <div className="card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="flex items-center gap-2">
              <Scale size={16} className="text-ink/40" />
              <span className="font-num text-3xl font-extrabold tabular">
                {a.estimateKcal.toLocaleString()}
              </span>
              <span className="text-sm text-ink/50">kcal/day</span>
            </p>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusTone}`}>
              {statusLabel}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <Meta label={t("plan.adaptive")} value={`${data.formulaTdee}`} sub="formula" />
            <Meta label={t("insights.avgIntake")} value={`${data.avgIntakeKcal}`} sub="kcal" />
            <Meta
              label={t("insights.confidence")}
              value={`${Math.round(a.confidence * 100)}%`}
              sub={`${data.days} d`}
            />
          </div>

          {a.status !== "settled" && (
            <p className="mt-4 text-sm text-ink/60">
              {t("insights.needsWeighIns").replace("{n}", String(a.moreWeighInsNeeded))}
            </p>
          )}
          {a.noiseNote && (
            <p className="mt-2 text-xs text-ink/45">{t("insights.noise")}</p>
          )}
        </div>
      </section>
    </div>
  );
}

function Meta({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-tile bg-surface-soft px-3 py-2.5">
      <p className="text-[11px] font-semibold text-ink/50">{label}</p>
      <p className="font-num mt-0.5 text-sm font-extrabold tabular">
        {value} <span className="text-[10px] font-semibold text-ink/40">{sub}</span>
      </p>
    </div>
  );
}
