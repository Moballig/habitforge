"use client";

import Link from "next/link";
import { useMutation, useQuery, api } from "@/lib/client/api";
import { useState, useSyncExternalStore } from "react";
import { useI18n } from "@/lib/i18n";
import { AreaChart, WeightTrendChart } from "@/components/data/Charts";
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

const CATEGORY_STYLES: Record<
  string,
  {
    border: string;
    bg: string;
    badge: string;
    labelEn: string;
    labelBn: string;
    icon: string;
  }
> = {
  staple_dal: {
    border: "border-amber-200/90 dark:border-amber-800/60 hover:border-amber-400 dark:hover:border-amber-600",
    bg: "bg-gradient-to-b from-amber-500/[0.05] to-surface",
    badge: "bg-amber-100/90 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 border border-amber-300/60 dark:border-amber-800/60",
    labelEn: "Dal & Legumes",
    labelBn: "ডাল ও ডালজাতীয়",
    icon: "🌾",
  },
  fish: {
    border: "border-sky-200/90 dark:border-sky-800/60 hover:border-sky-400 dark:hover:border-sky-600",
    bg: "bg-gradient-to-b from-sky-500/[0.05] to-surface",
    badge: "bg-sky-100/90 dark:bg-sky-950/70 text-sky-900 dark:text-sky-200 border border-sky-300/60 dark:border-sky-800/60",
    labelEn: "Fish",
    labelBn: "মাছ",
    icon: "🐟",
  },
  egg_poultry: {
    border: "border-violet-200/90 dark:border-violet-800/60 hover:border-violet-400 dark:hover:border-violet-600",
    bg: "bg-gradient-to-b from-violet-500/[0.05] to-surface",
    badge: "bg-violet-100/90 dark:bg-violet-950/70 text-violet-900 dark:text-violet-200 border border-violet-300/60 dark:border-violet-800/60",
    labelEn: "Egg & Poultry",
    labelBn: "ডিম ও মুরগি",
    icon: "🥚",
  },
  soy_seeds: {
    border: "border-emerald-200/90 dark:border-emerald-800/60 hover:border-emerald-400 dark:hover:border-emerald-600",
    bg: "bg-gradient-to-b from-emerald-500/[0.05] to-surface",
    badge: "bg-emerald-100/90 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-200 border border-emerald-300/60 dark:border-emerald-800/60",
    labelEn: "Soy & Seeds",
    labelBn: "সয়াবিন ও বীজ",
    icon: "🌱",
  },
  dairy: {
    border: "border-rose-200/90 dark:border-rose-800/60 hover:border-rose-400 dark:hover:border-rose-600",
    bg: "bg-gradient-to-b from-rose-500/[0.05] to-surface",
    badge: "bg-rose-100/90 dark:bg-rose-950/70 text-rose-900 dark:text-rose-200 border border-rose-300/60 dark:border-rose-800/60",
    labelEn: "Dairy",
    labelBn: "দুগ্ধজাত",
    icon: "🥛",
  },
};

const NOISE_THEMES: Record<
  string,
  {
    chipActive: string;
    chipInactive: string;
    badge: string;
  }
> = {
  eid_feast: {
    chipActive: "bg-amber-600 text-white ring-2 ring-amber-400/50 shadow-sm",
    chipInactive: "bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 border border-amber-200/80 dark:border-amber-800/60 hover:bg-amber-100 dark:hover:bg-amber-900/40",
    badge: "bg-amber-100/90 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 border border-amber-300/70 dark:border-amber-800/60",
  },
  salty_meal: {
    chipActive: "bg-sky-600 text-white ring-2 ring-sky-400/50 shadow-sm",
    chipInactive: "bg-sky-50 dark:bg-sky-950/30 text-sky-800 dark:text-sky-200 border border-sky-200/80 dark:border-sky-800/60 hover:bg-sky-100 dark:hover:bg-sky-900/40",
    badge: "bg-sky-100/90 dark:bg-sky-950/70 text-sky-900 dark:text-sky-200 border border-sky-300/70 dark:border-sky-800/60",
  },
  cycle: {
    chipActive: "bg-rose-600 text-white ring-2 ring-rose-400/50 shadow-sm",
    chipInactive: "bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-200 border border-rose-200/80 dark:border-rose-800/60 hover:bg-rose-100 dark:hover:bg-rose-900/40",
    badge: "bg-rose-100/90 dark:bg-rose-950/70 text-rose-900 dark:text-rose-200 border border-rose-300/70 dark:border-rose-800/60",
  },
  travel: {
    chipActive: "bg-violet-600 text-white ring-2 ring-violet-400/50 shadow-sm",
    chipInactive: "bg-violet-50 dark:bg-violet-950/30 text-violet-800 dark:text-violet-200 border border-violet-200/80 dark:border-violet-800/60 hover:bg-violet-100 dark:hover:bg-violet-900/40",
    badge: "bg-violet-100/90 dark:bg-violet-950/70 text-violet-900 dark:text-violet-200 border border-violet-300/70 dark:border-violet-800/60",
  },
  illness: {
    chipActive: "bg-red-600 text-white ring-2 ring-red-400/50 shadow-sm",
    chipInactive: "bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-200 border border-red-200/80 dark:border-red-800/60 hover:bg-red-100 dark:hover:bg-red-900/40",
    badge: "bg-red-100/90 dark:bg-red-950/70 text-red-900 dark:text-red-200 border border-red-300/70 dark:border-red-800/60",
  },
};

const HYDRATION_SLOT_STYLES = [
  {
    theme: "border-amber-300/80 dark:border-amber-700/60 bg-amber-500/[0.08]",
    icon: "🌅",
    badge: "text-amber-900 dark:text-amber-200 bg-amber-100 dark:bg-amber-950/70 border border-amber-300/60",
  },
  {
    theme: "border-sky-300/80 dark:border-sky-700/60 bg-sky-500/[0.08]",
    icon: "🌙",
    badge: "text-sky-900 dark:text-sky-200 bg-sky-100 dark:bg-sky-950/70 border border-sky-300/60",
  },
  {
    theme: "border-violet-300/80 dark:border-violet-700/60 bg-violet-500/[0.08]",
    icon: "✨",
    badge: "text-violet-900 dark:text-violet-200 bg-violet-100 dark:bg-violet-950/70 border border-violet-300/60",
  },
  {
    theme: "border-teal-300/80 dark:border-teal-700/60 bg-teal-500/[0.08]",
    icon: "🌄",
    badge: "text-teal-900 dark:text-teal-200 bg-teal-100 dark:bg-teal-950/70 border border-teal-300/60",
  },
];

const MEAL_PACING_STYLES: Record<string, { card: string; badge: string; icon: string }> = {
  iftar: {
    card: "border-amber-300/80 dark:border-amber-800/70 bg-gradient-to-b from-amber-500/[0.08] to-surface",
    badge: "bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 border border-amber-300/50",
    icon: "🌅",
  },
  post_prayer_dinner: {
    card: "border-violet-300/80 dark:border-violet-800/70 bg-gradient-to-b from-violet-500/[0.08] to-surface",
    badge: "bg-violet-100 dark:bg-violet-950/70 text-violet-900 dark:text-violet-200 border border-violet-300/50",
    icon: "🌙",
  },
  sehri: {
    card: "border-emerald-300/80 dark:border-emerald-800/70 bg-gradient-to-b from-emerald-500/[0.08] to-surface",
    badge: "bg-emerald-100 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-200 border border-emerald-300/50",
    icon: "🌄",
  },
};

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
        <h1 className="text-2xl font-extrabold md:text-3xl">{t("nav.progress")}</h1>
        <div className="tile h-40 animate-pulse" aria-busy="true" aria-label="Loading progress" />
      </div>
    );
  }

  if (data === null) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-extrabold md:text-3xl">{t("nav.progress")}</h1>
        <NoticeCard
          tone="info"
          title={t("states.empty")}
          body="Set up your profile to see progress."
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
        noteKey: w.note!,
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
        <h1 className="text-2xl font-extrabold md:text-3xl">{t("nav.progress")}</h1>
        <p className="mt-1 text-sm text-ink/60">{t("insights.subtitle")}</p>
      </div>

      {/* ─── Wave 6: Cheap-Protein Finder & Taka Economics (FR-G-05) ─── */}
      <section id="cheap-protein" className="space-y-4 scroll-mt-20">
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
            <div className="rounded-tile bg-emerald-500/[0.08] dark:bg-emerald-950/30 border border-emerald-500/25 dark:border-emerald-800/50 p-2.5">
              <span className="text-[10px] font-extrabold text-emerald-800 dark:text-emerald-300">
                🌱 {lang === "bn" ? "সাশ্রয়ী ডাল+সয়া মিক্স" : "Economy (Dal + Soy)"}
              </span>
              <p className="font-num text-base font-extrabold text-emerald-950 dark:text-emerald-100 mt-0.5">
                ৳{proteinCostBudget.lowCostBDT}
                <span className="text-[10px] font-normal text-emerald-800/60 dark:text-emerald-300/60">/day</span>
              </p>
            </div>
            <div className="rounded-tile bg-violet-500/[0.08] dark:bg-violet-950/30 border border-violet-500/25 dark:border-violet-800/50 p-2.5">
              <span className="text-[10px] font-extrabold text-violet-800 dark:text-violet-300">
                🍳 {lang === "bn" ? "ডিম + পাঙ্গাশ + ডাল" : "Balanced (Egg+Fish+Dal)"}
              </span>
              <p className="font-num text-base font-extrabold text-violet-950 dark:text-violet-100 mt-0.5">
                ৳{proteinCostBudget.balancedCostBDT}
                <span className="text-[10px] font-normal text-violet-800/60 dark:text-violet-300/60">/day</span>
              </p>
            </div>
            <div className="rounded-tile bg-amber-500/[0.08] dark:bg-amber-950/30 border border-amber-500/25 dark:border-amber-800/50 p-2.5">
              <span className="text-[10px] font-extrabold text-amber-800 dark:text-amber-300">
                🥩 {lang === "bn" ? "রেগুলার মাংস/ইলিশ" : "Premium (Meat/Hilsa)"}
              </span>
              <p className="font-num text-base font-extrabold text-amber-950 dark:text-amber-100 mt-0.5">
                ৳{proteinCostBudget.premiumCostBDT}
                <span className="text-[10px] font-normal text-amber-800/60 dark:text-amber-300/60">/day</span>
              </p>
            </div>
          </div>
        </div>

        {/* Top Protein Items Grid */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {proteinList.slice(0, 6).map((item, idx) => {
            const catStyle = CATEGORY_STYLES[item.category] ?? CATEGORY_STYLES.staple_dal;
            return (
              <div
                key={item.id}
                className={`card relative flex flex-col justify-between p-4 transition-all border ${catStyle.border} ${catStyle.bg} shadow-xs hover:shadow-sm`}
              >
                {idx === 0 && (
                  <span className="absolute -top-2.5 right-3 rounded-full bg-gradient-to-r from-amber-500 to-emerald-500 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-sm ring-2 ring-surface">
                    ★ {lang === "bn" ? "শীর্ষ মান" : "Best Value"}
                  </span>
                )}
                <div>
                  <div className="flex items-center justify-between gap-1.5 mb-2">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${catStyle.badge}`}>
                      <span>{catStyle.icon}</span>
                      <span>{lang === "bn" ? catStyle.labelBn : catStyle.labelEn}</span>
                    </span>
                    <span className="rounded-md bg-surface border border-border/70 px-1.5 py-0.5 text-[11px] font-bold text-ink/75">
                      ৳{item.pricePerKgBDT}/kg
                    </span>
                  </div>
                  <h3 className="font-extrabold text-ink text-base">
                    {lang === "bn" ? item.nameBn : item.nameEn}
                  </h3>
                  <p className="mt-1 text-xs text-ink/60 font-medium">
                    {item.proteinPer100g}g protein / 100g ({item.kcalPer100g} kcal)
                  </p>
                </div>

                <div className="mt-3.5 grid grid-cols-2 gap-2 border-t border-border/40 pt-2.5 text-xs">
                  <div className="rounded-md bg-accent/10 border border-accent/25 p-2 text-left">
                    <span className="block text-[10px] font-bold text-accent-ink">
                      {lang === "bn" ? "১০০ টাকায় প্রোটিন" : "Protein / ৳100"}
                    </span>
                    <p className="font-num text-sm font-black text-accent-ink mt-0.5">
                      {item.proteinPer100BDT}g
                    </p>
                  </div>
                  <div className="rounded-md bg-surface border border-border/60 p-2 text-right">
                    <span className="block text-[10px] font-bold text-ink/55">
                      {lang === "bn" ? "২০ গ্রাম প্রোটিন" : "Cost for 20g"}
                    </span>
                    <p className="font-num text-sm font-extrabold text-ink mt-0.5">
                      ৳{item.costPer20gProteinBDT}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
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
                {lang === "bn" ? "রমজানে ক্যালরি কমানো নয়" : "No calorie cut during Ramadan"}
              </span>
            </div>

            {/* Hydration Slots */}
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
              {fastingPlan.hydrationSlots.map((slot, i) => {
                const slotStyle = HYDRATION_SLOT_STYLES[i % HYDRATION_SLOT_STYLES.length];
                return (
                  <div
                    key={i}
                    className={`rounded-tile p-3.5 text-xs border ${slotStyle.theme} transition-all`}
                  >
                    <div className="flex items-center justify-between font-extrabold text-ink">
                      <span className="flex items-center gap-1.5">
                        <span>{slotStyle.icon}</span>
                        <span>{lang === "bn" ? slot.timeLabelBn : slot.timeLabelEn}</span>
                      </span>
                      <span className={`font-num rounded-md px-1.5 py-0.5 text-[11px] font-black ${slotStyle.badge}`}>
                        {slot.targetGlasses} 🥛
                      </span>
                    </div>
                    <p className="mt-2 text-[11px] text-ink/75 leading-relaxed font-medium">
                      {slot.recommended}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Meal Pacing Guidelines */}
            <div className="space-y-2 pt-2">
              <p className="text-xs font-bold text-ink/70 uppercase tracking-wide">
                {lang === "bn" ? "খাবারের সঠিক বণ্টন ও সংযম" : "Meal Energy Pacing & Moderation"}
              </p>
              <div className="grid gap-3 md:grid-cols-3">
                {fastingPlan.mealPacing.map((meal, i) => {
                  const pacingStyle = MEAL_PACING_STYLES[meal.slot] ?? {
                    card: "border-border/60 bg-surface",
                    badge: "bg-surface-soft text-ink",
                    icon: "🍽️",
                  };
                  return (
                    <div
                      key={i}
                      className={`rounded-tile p-3.5 text-xs border ${pacingStyle.card} space-y-2`}
                    >
                      <div className="flex items-center justify-between font-extrabold text-ink">
                        <span className="flex items-center gap-1.5 capitalize">
                          <span>{pacingStyle.icon}</span>
                          <span>
                            {meal.slot === "iftar"
                              ? lang === "bn" ? "ইফতার (৩০%)" : "Iftar (30%)"
                              : meal.slot === "post_prayer_dinner"
                                ? lang === "bn" ? "তারাবির পর খাবার (৩৫%)" : "Dinner (35%)"
                                : lang === "bn" ? "সেহরি (৩৫%)" : "Sehri (35%)"}
                          </span>
                        </span>
                        <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <p className="text-ink/85 leading-relaxed font-medium">
                        {lang === "bn" ? meal.recommendationBn : meal.recommendationEn}
                      </p>
                      <div className="rounded-md bg-red-500/[0.08] border border-red-500/20 p-2 text-[11px] text-red-700 dark:text-red-300">
                        <strong className="font-extrabold">{lang === "bn" ? "সীমিত রাখুন: " : "Limit: "}</strong>
                        {lang === "bn" ? meal.itemsToLimitBn : meal.itemsToLimitEn}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ─── Weigh-In & Weight Trend Section (A9) ─── */}
      <section className="space-y-4">
        <SectionLabel>{t("insights.weighIn")}</SectionLabel>
        <form onSubmit={handleAdd} className="card space-y-3.5 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                step="0.1"
                min="30"
                max="300"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder={t("insights.weightPlaceholder")}
                className="input w-28 font-num text-sm"
                aria-label={t("insights.weightPlaceholder")}
              />
              <span className="text-xs font-semibold text-ink/50">kg</span>
            </div>

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

          {/* Inline tag chips (A9) */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-border/40">
            <span className="text-xs font-semibold text-ink/50 mr-1">
              {lang === "bn" ? "ট্যাগ / কারণ:" : "Tag / context:"}
            </span>
            {NOISE_NOTES.filter((n) => n.value !== "none").map((n) => {
              const isSelected = note === n.value;
              const theme = NOISE_THEMES[n.value] ?? {
                chipActive: "bg-violet text-white ring-2 ring-violet/20 shadow-sm",
                chipInactive: "bg-surface-soft text-ink/70 border border-border/40 hover:bg-surface-soft/80",
                badge: "bg-peach/40 text-ink/80",
              };
              return (
                <button
                  key={n.value}
                  type="button"
                  onClick={() => setNote(isSelected ? "none" : n.value)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-all ${
                    isSelected ? theme.chipActive : theme.chipInactive
                  }`}
                >
                  <span>{n.icon}</span>
                  <span>{lang === "bn" ? n.labelBn : n.labelEn}</span>
                </button>
              );
            })}
          </div>

          {/* Reassurance text appears ONLY when a tag is selected (A9) */}
          {note !== "none" && (
            <div className="rounded-tile bg-peach/30 border border-peach/50 p-3 text-xs text-ink/80 animate-fade-in flex items-start gap-2">
              <span className="text-base leading-none">💡</span>
              <p className="leading-relaxed">
                {note === "eid_feast"
                  ? (lang === "bn"
                      ? "দাওয়াত বা ঈদের ভোজের পর স্কেলে ১-২ কেজি বৃদ্ধি চর্বি নয়, বরং অস্থায়ী গ্লাইকোজেন ও পানি জমা। ২-৩ দিনেই স্কেল স্বাভাবিক হবে।"
                      : "Weight spikes of 1–2 kg after feasts reflect temporary glycogen and water shifts, not fat gain. It normalizes in 2–3 days.")
                  : note === "salty_meal"
                    ? (lang === "bn"
                        ? "অতিরিক্ত সোডিয়ামযুক্ত খাবারে কোষে পানি আটকে থাকে। পর্যাপ্ত পানি খেলে ২৪-৪৮ ঘণ্টার মধ্যে স্বাভাবিক হবে।"
                        : "High sodium holds extra fluid in cells. Drinking regular water helps shed it within 24–48 hours.")
                    : note === "cycle"
                      ? (lang === "bn"
                          ? "মাসিক চক্রের হরমোন পরিবর্তনে অস্থায়ী পানি জমা স্বাভাবিক। ৭ দিনের ট্রেন্ড লাইন স্কেলের বিভ্রান্তি দূর করে।"
                          : "Hormonal fluid retention during your cycle is completely normal. The 7-day smoothed trend filters this out.")
                      : note === "travel"
                        ? (lang === "bn"
                            ? "ভ্রমণ বা ঘুমের পরিবর্তনে শরীরে সাময়িক কর্টিসল ও পানি তারতম্য ঘটে। বিশ্রাম নিলে দ্রুত ঠিক হয়ে যাবে।"
                            : "Travel and sleep shifts alter fluid retention. Regular rest will settle the scale back on trend.")
                        : (lang === "bn"
                            ? "অসুস্থতা বা ওষুধের কারণে ওজনে সাময়িক হেরফের হতে পারে। সুস্থ হওয়াকে অগ্রাধিকার দিন; ওজন নিজে থেকেই স্বাভাবিক হবে।"
                            : "Illness and medications affect hydration. Prioritize recovery; your weight will steady automatically.")}
              </p>
            </div>
          )}
        </form>

        {data.weighIns.length > 0 && (
          <div className="card space-y-3 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-3 font-semibold">
                <span className="flex items-center gap-1.5 text-violet">
                  <span className="inline-block h-1 w-4 rounded-full bg-violet" />
                  {lang === "bn" ? "৭ দিনের স্মুথড ট্রেন্ড (মূল লাইন)" : "7-day smoothed trend"}
                </span>
                <span className="flex items-center gap-1.5 text-ink/65">
                  <span className="inline-block h-2 w-2 rounded-full border border-ink/40 bg-surface" />
                  {lang === "bn" ? "স্কেলের ওজন (বিন্দু)" : "Raw weigh-ins"}
                </span>
                <span className="flex items-center gap-1.5 text-turmeric">
                  <span className="inline-block h-2 w-2 rounded-full bg-turmeric" />
                  {lang === "bn" ? "চিহ্নিত দিন" : "Tagged day"}
                </span>
              </div>
              <span className="text-[11px] text-ink/40">Noise smoothed</span>
            </div>

            <WeightTrendChart
              rawWeights={chartData}
              smoothedWeights={chartSmoothed}
              labels={chartLabels}
              noiseTags={data.weighIns.map((w) => w.note)}
              height={160}
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
              <span className="font-num font-semibold text-violet">
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
                  {recentNotes.map((entry, idx) => {
                    const theme = NOISE_THEMES[entry.noteKey]?.badge ?? "bg-surface-soft text-ink/80 border border-border/50";
                    return (
                      <span key={idx} className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${theme}`}>
                        {formatShortDate(entry.date, lang)}: {entry.tagLabel}
                      </span>
                    );
                  })}
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

      {/* ─── Adaptive Estimate Accordion (A9) ─── */}
      <section>
        <details className="card group overflow-hidden border border-border/80 transition-all open:ring-1 open:ring-violet/20">
          <summary className="flex cursor-pointer list-none items-center justify-between p-5 hover:bg-surface-soft/40 focus-visible:outline-none">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Scale size={16} className="text-violet" />
                <span className="font-extrabold text-base text-ink">
                  {t("insights.howWeEstimate")}
                </span>
              </div>
              <p className="text-sm font-semibold text-ink/75">
                {lang === "bn"
                  ? `আমাদের হিসাব আরও নির্ভুল হচ্ছে: ১৪ দিনের মধ্যে ${Math.min(14, data.days || 1)} দিন`
                  : `Our estimate is getting better: day ${Math.min(14, data.days || 1)} of 14`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusTone}`}>
                {statusLabel}
              </span>
              <span className="text-ink/40 transition-transform duration-200 group-open:rotate-180">
                ▾
              </span>
            </div>
          </summary>

          <div className="border-t border-border/60 bg-surface p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs text-ink/50 uppercase font-semibold tracking-wider">
                  {lang === "bn" ? "বর্তমান দৈনিক খরচ অনুমান" : "Current Daily Burn Estimate"}
                </p>
                <p className="font-num text-3xl font-extrabold tabular text-ink mt-0.5">
                  {a.estimateKcal.toLocaleString()}{" "}
                  <span className="text-sm font-medium text-ink/50">kcal/day</span>
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-ink/50">
                  {lang === "bn" ? "আস্থা স্তর" : "Confidence"}
                </span>
                <p className="font-num text-base font-extrabold text-violet">
                  {Math.round(a.confidence * 100)}%
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Meta
                label={lang === "bn" ? "সূত্র অনুযায়ী" : "Formula base"}
                value={`${data.formulaTdee}`}
                sub="kcal"
                tone="violet"
              />
              <Meta
                label={lang === "bn" ? "গড় খাবার গ্রহণ" : "Avg intake"}
                value={`${data.avgIntakeKcal}`}
                sub="kcal"
                tone="amber"
              />
              <Meta
                label={lang === "bn" ? "লগ করা দিন" : "Days logged"}
                value={`${data.days}`}
                sub="of 14 d"
                tone="emerald"
              />
            </div>

            <p className="text-xs text-ink/60 leading-relaxed">
              {lang === "bn"
                ? "প্রথম ১৪ দিনে ইঞ্জিনটি প্রাথমিক ফর্মুলার ওপর নির্ভরতা কমিয়ে আপনার বাস্তব খাবার গ্রহণ ও ওজনের পরিবর্তনের ট্রেন্ডের ভিত্তিতে দৈনিক ক্যালরি ব্যয়ের হিসাব আরও নির্ভুল করে তোলে।"
                : "Over the 14-day calibration window, the engine transitions from baseline population formula to your actual logged intake and weight trend for a truly personal estimate."}
            </p>

            {a.status !== "settled" && (
              <p className="text-xs font-semibold text-primary">
                {t("insights.needsWeighIns").replace("{n}", String(a.moreWeighInsNeeded))}
              </p>
            )}
          </div>
        </details>
      </section>
    </div>
  );
}

function Meta({
  label,
  value,
  sub,
  tone = "neutral",
}: {
  label: string;
  value: string;
  sub: string;
  tone?: "violet" | "amber" | "emerald" | "neutral";
}) {
  const toneClasses = {
    violet: "bg-violet-500/[0.08] dark:bg-violet-950/30 border border-violet-500/25 dark:border-violet-800/60 text-violet-950 dark:text-violet-200",
    amber: "bg-amber-500/[0.08] dark:bg-amber-950/30 border border-amber-500/25 dark:border-amber-800/60 text-amber-950 dark:text-amber-200",
    emerald: "bg-emerald-500/[0.08] dark:bg-emerald-950/30 border border-emerald-500/25 dark:border-emerald-800/60 text-emerald-950 dark:text-emerald-200",
    neutral: "bg-surface-soft border border-border/50 text-ink",
  }[tone];

  return (
    <div className={`rounded-tile p-3 ${toneClasses} transition-all`}>
      <p className="text-[11px] font-extrabold opacity-75">{label}</p>
      <p className="font-num mt-1 text-base font-black tabular">
        {value} <span className="text-[10px] font-semibold opacity-60">{sub}</span>
      </p>
    </div>
  );
}
