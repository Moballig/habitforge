"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Camera, Mic, ScanBarcode, Search } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { FOODS, TODAY_MEALS } from "@/lib/mock";
import type { FoodItem, LoggedItem, MealSlot } from "@/lib/types";
import { Chip, Range, SectionLabel, SourceTag } from "@/components/data/Primitives";
import { TabBar } from "@/components/data/Cards";
import { Button, Sheet } from "@/components/forms/Forms";
import { NoticeCard } from "@/components/shell/Banners";
import { formatKcal } from "@/lib/format";

const SLOTS: { id: MealSlot; key: string }[] = [
  { id: "breakfast", key: "log.breakfast" },
  { id: "lunch", key: "log.lunch" },
  { id: "snacks", key: "log.snacks" },
  { id: "dinner", key: "log.dinner" },
];

function matchFoods(q: string): FoodItem[] {
  const s = q.trim().toLowerCase();
  if (!s) return [];
  return FOODS.filter(
    (f) =>
      f.nameEn.toLowerCase().includes(s) ||
      f.nameBn.includes(q.trim()) ||
      f.aliases.some((a) => a.toLowerCase().includes(s)),
  ).slice(0, 5);
}

function toLogged(f: FoodItem, qty: number, unitLabel: string): LoggedItem {
  const m = f.measures.find((x) => x.label === unitLabel) ?? f.measures[0];
  const grams = m.grams * qty;
  const factor = grams / 100;
  const mid = f.kcalPer100 * factor;
  const low = f.rangeLow ? f.rangeLow * factor : mid * 0.85;
  const high = f.rangeHigh ? f.rangeHigh * factor : mid * 1.15;
  return {
    foodId: f.id,
    nameBn: f.nameBn,
    nameEn: f.nameEn,
    quantity: qty,
    unit: unitLabel,
    grams: Math.round(grams),
    kcalLow: Math.round(low),
    kcalHigh: Math.round(high),
    sourceTag: f.sourceTag,
  };
}

export default function LogPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [slot, setSlot] = useState<MealSlot>("lunch");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [picked, setPicked] = useState<FoodItem | null>(null);
  const [unit, setUnit] = useState("");
  const [qty, setQty] = useState(1);
  const [sharedPot, setSharedPot] = useState(false);
  const [saved, setSaved] = useState<LoggedItem[]>([]);
  const [toast, setToast] = useState(false);

  const candidates = useMemo(() => matchFoods(query), [query]);

  function selectFood(f: FoodItem) {
    setPicked(f);
    setUnit(f.measures[0]?.label ?? "portion");
    setQty(1);
    setSheetOpen(true);
  }

  function confirmSave() {
    if (!picked) return;
    const item = toLogged(picked, qty, unit);
    setSaved((s) => [...s, item]);
    setSheetOpen(false);
    setPicked(null);
    setQuery("");
    setToast(true);
    setTimeout(() => setToast(false), 2500);
  }

  const savedKcalLow = saved.reduce((s, i) => s + i.kcalLow, 0);
  const savedKcalHigh = saved.reduce((s, i) => s + i.kcalHigh, 0);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold md:text-3xl">{t("log.title")}</h1>
      </header>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40" aria-hidden />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("log.ph")}
            aria-label={t("log.title")}
            className="pill-input min-h-14 pl-11 pr-24 text-[15px]"
          />
          <div className="absolute right-2 top-1/2 flex -translate-y-1/2 gap-1">
            <button
              type="button"
              aria-label="Voice"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-soft text-ink/60"
              title="Chrome only"
            >
              <Mic size={17} />
            </button>
            <button
              type="button"
              aria-label="Photo"
              onClick={() => router.push("/log/photo")}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-violet text-white"
            >
              <Camera size={17} />
            </button>
            <button
              type="button"
              aria-label="Barcode"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-soft text-ink/60"
            >
              <ScanBarcode size={17} />
            </button>
          </div>
        </div>
      </div>

      <TabBar
        tabs={SLOTS.map((s) => ({ id: s.id, label: t(s.key) }))}
        active={slot}
        onChange={(id) => setSlot(id as MealSlot)}
      />

      <div className="flex flex-wrap gap-2">
        <Chip>{t("log.recents")}</Chip>
        <Chip>{t("log.favourites")}</Chip>
        <Chip>{t("log.sameYesterday")}</Chip>
        <Chip>{t("log.copyMeal")}</Chip>
      </div>

      <div className="flex flex-wrap gap-2">
        <Chip selected={sharedPot} onClick={() => setSharedPot(!sharedPot)}>
          {t("log.sharedPot")}
        </Chip>
        <Chip onClick={() => router.push("/log/rice")}>{t("log.rice")}</Chip>
        <Chip onClick={() => router.push("/log/recipe")}>{t("log.recipe")}</Chip>
        <Chip onClick={() => router.push("/log/street")}>{t("log.street")}</Chip>
        <Chip onClick={() => router.push("/log/photo")}>{t("log.photo")}</Chip>
      </div>

      {query && (
        <section>
          <SectionLabel>{t("log.candidates")}</SectionLabel>
          {candidates.length === 0 ? (
            <NoticeCard
              tone="info"
              title={t("log.tapPick")}
              body="Try bhat, dal, dim, ruti, biriyani…"
            />
          ) : (
            <ul className="space-y-2">
              {candidates.map((f) => (
                <li key={f.id}>
                  <button
                    type="button"
                    onClick={() => selectFood(f)}
                    className="card flex w-full items-center justify-between gap-3 p-4 text-left"
                  >
                    <div className="min-w-0">
                      <p className="font-bold">{f.nameBn}</p>
                      <p className="text-sm text-ink/50">{f.nameEn}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <Range
                        low={f.kcalPer100 * 0.85 * (f.measures[0]?.grams ?? 100) / 100}
                        high={f.kcalPer100 * 1.15 * (f.measures[0]?.grams ?? 100) / 100}
                        className="text-sm font-bold"
                      />
                      <SourceTag tag={f.sourceTag} />
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section>
        <SectionLabel>{t("home.mealsToday")}</SectionLabel>
        <ul className="space-y-2">
          {[...TODAY_MEALS, ...(saved.length ? [{ id: "new", slot, items: saved, method: "text" as const, date: "", time: "now" }] : [])].map((m) => (
            <li key={m.id} className="tile p-4">
              <div className="flex items-center justify-between">
                <p className="font-bold capitalize">{m.slot}</p>
                <span className="font-num text-sm font-bold tabular text-ink/60">
                  {formatKcal(m.items.reduce((s, i) => s + i.kcalLow, 0))}–
                  {formatKcal(m.items.reduce((s, i) => s + i.kcalHigh, 0))} kcal
                </span>
              </div>
              <ul className="mt-2 space-y-1.5">
                {m.items.map((i, idx) => (
                  <li key={idx} className="flex items-center justify-between gap-2 text-sm">
                    <span className="min-w-0 truncate">
                      {i.nameEn} <span className="text-ink/45">× {i.quantity} {i.unit}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <Range low={i.kcalLow} high={i.kcalHigh} className="text-xs font-semibold text-ink/55" />
                      <SourceTag tag={i.sourceTag} />
                    </span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
        {saved.length > 0 && (
          <div className="mt-3 flex items-center justify-between rounded-tile bg-mint px-4 py-3 text-sm font-semibold text-mint-ink">
            <span>
              {t("common.save")} · <Range low={savedKcalLow} high={savedKcalHigh} />
            </span>
            <span>✓ {t("states.saved")}</span>
          </div>
        )}
      </section>

      {toast && (
        <div role="status" className="toast-in fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-5 py-3 text-sm font-bold text-white md:bottom-8">
          {t("states.saved")}
        </div>
      )}

      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title={picked ? `${picked.nameBn} · ${picked.nameEn}` : ""}>
        {picked && (
          <div className="space-y-5">
            <div>
              <p className="mb-2 text-sm font-semibold text-ink/55">{t("log.portion")}</p>
              <div className="flex flex-wrap gap-2">
                {picked.measures.map((m) => (
                  <Chip key={m.label} selected={unit === m.label} onClick={() => setUnit(m.label)}>
                    {m.label} ({m.grams}g)
                  </Chip>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-ink/55">Qty</span>
              <div className="flex items-center gap-3 rounded-full border border-border px-2 py-1">
                <button type="button" className="h-10 w-10 rounded-full bg-surface-soft font-bold" onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Less">−</button>
                <span className="font-num w-8 text-center font-extrabold tabular">{qty}</span>
                <button type="button" className="h-10 w-10 rounded-full bg-surface-soft font-bold" onClick={() => setQty(qty + 1)} aria-label="More">+</button>
              </div>
            </div>
            <div className="tile p-4">
              <p className="text-xs font-semibold text-ink/50">Result</p>
              <p className="font-num mt-1 text-2xl font-extrabold tabular">
                <Range low={toLogged(picked, qty, unit).kcalLow} high={toLogged(picked, qty, unit).kcalHigh} />
              </p>
              <p className="mt-1 text-sm text-ink/55">{toLogged(picked, qty, unit).grams} g</p>
              <div className="mt-2 flex gap-2">
                <SourceTag tag={picked.sourceTag} />
                <button type="button" className="text-xs font-bold underline text-ink/50">
                  {t("log.reportWrong")}
                </button>
              </div>
            </div>
            <Button full onClick={confirmSave}>
              {t("log.confirmSave")} {t(`log.${slot}`)}
            </Button>
          </div>
        )}
      </Sheet>
    </div>
  );
}
