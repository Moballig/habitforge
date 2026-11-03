"use client";

import { useState, useSyncExternalStore } from "react";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { Button, Select, Field } from "@/components/forms/Forms";
import { Range, SectionLabel, SourceTag, Chip } from "@/components/data/Primitives";
import { NoticeCard } from "@/components/shell/Banners";
import { api } from "../../../../../convex/_generated/api";
import { todayISO } from "@/lib/foods/search";
import type { MealSlot } from "@/lib/types";

type StreetItem = {
  id: string;
  label: string;
  low: number;
  high: number;
  grams: number;
  withOil?: boolean;
};

// Demo street-food table — FCTB/restaurant data lands in Wave 3.
const ITEMS: StreetItem[] = [
  { id: "khichuri", label: "খিচুড়ি / Khichuri plate", low: 450, high: 650, grams: 350 },
  { id: "biryani", label: "বিরিয়ানি / Biriyani plate", low: 700, high: 950, grams: 400 },
  { id: "fuchka", label: "ফুচকা / Fuchka (6)", low: 250, high: 350, grams: 150 },
  { id: "jhal-muri", label: "ঝালমুড়ি / Jhal muri cup", low: 200, high: 280, grams: 120 },
  { id: "burger", label: "বার্গার / Beef burger", low: 480, high: 680, grams: 250, withOil: true },
  { id: "singara", label: "সিঙ্গারা ×2 / Samosa ×2", low: 260, high: 340, grams: 100 },
];

const SLOTS: { id: MealSlot; key: string }[] = [
  { id: "breakfast", key: "log.breakfast" },
  { id: "lunch", key: "log.lunch" },
  { id: "snacks", key: "log.snacks" },
  { id: "dinner", key: "log.dinner" },
];

export default function StreetFoodPage() {
  const { t } = useI18n();
  const router = useRouter();
  // Client-only date; server snapshot is "" so prerender never calls new Date()
  const date = useSyncExternalStore(
    () => () => {},
    () => todayISO(),
    () => "",
  );
  const createMeal = useMutation(api.mealLogs.create);
  const [qty, setQty] = useState(1);
  const [oil, setOil] = useState<"extra" | "normal" | "less">("normal");
  const [pickedId, setPickedId] = useState("khichuri");
  const [slot, setSlot] = useState<MealSlot>("lunch");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const item = ITEMS.find((i) => i.id === pickedId) ?? ITEMS[0];
  const oilFactor = oil === "extra" ? 1.12 : oil === "less" ? 0.92 : 1;
  const low = Math.round(item.low * qty * oilFactor);
  const high = Math.round(item.high * qty * oilFactor);

  async function save() {
    if (saved || saving || !date) return;
    setSaving(true);
    setError(null);
    try {
      const [nameBn, nameEn] = item.label.split(" / ");
      await createMeal({
        date,
        slot,
        method: "preset",
        items: [
          {
            nameBn,
            nameEn,
            quantity: qty,
            unit: "serving",
            grams: item.grams * qty,
            kcalLow: low,
            kcalHigh: high,
            sourceTag: "estimated",
          },
        ],
      });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold md:text-3xl">{t("log.street")}</h1>
        <p className="mt-1 text-sm text-ink/55">Restaurant & street portions with honest ranges.</p>
      </header>

      <section>
        <SectionLabel>Item</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {ITEMS.map((it) => (
            <Chip key={it.id} selected={pickedId === it.id} onClick={() => setPickedId(it.id)}>
              {it.label}
            </Chip>
          ))}
        </div>
      </section>

      <section className="card space-y-4 p-5">
        <Field label="Servings" htmlFor="street-qty">
          <div className="flex items-center gap-3">
            <input
              id="street-qty"
              type="range"
              min={1}
              max={4}
              step={1}
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
              className="h-2 flex-1 accent-violet"
            />
            <span className="font-num w-8 text-right text-xl font-extrabold tabular">{qty}</span>
          </div>
        </Field>
        <Select
          label="Cooking oil"
          id="oil"
          value={oil}
          onChange={(v) => setOil(v as typeof oil)}
          options={[
            { value: "less", label: "Less oil than usual" },
            { value: "normal", label: "Normal" },
            { value: "extra", label: "Extra oil / ghee" },
          ]}
        />
        <div className="rounded-tile bg-peach px-4 py-3 text-peach-ink">
          <p className="text-xs font-semibold opacity-70">Range</p>
          <p className="font-num text-2xl font-extrabold tabular">
            <Range low={low} high={high} />
          </p>
          <div className="mt-2 flex gap-2">
            <SourceTag tag="borrowed" />
            <SourceTag tag="estimated" />
          </div>
        </div>
      </section>

      <NoticeCard
        tone="gentle"
        title="Street portions vary"
        body="A 'plate' in Old Dhaka may differ from your area. Adjust qty to match what you actually got."
      />

      {error && (
        <NoticeCard tone="error" title="Could not save" body={error} />
      )}

      <div className="flex flex-wrap gap-2">
        {SLOTS.map((s) => (
          <Chip key={s.id} selected={slot === s.id} onClick={() => setSlot(s.id)}>
            {t(s.key)}
          </Chip>
        ))}
      </div>

      <div className="flex gap-3">
        <Button variant="secondary" onClick={() => router.back()}>
          {t("common.back")}
        </Button>
        <Button full disabled={saved || saving} onClick={() => void save()}>
          {saved
            ? `✓ ${t("states.saved")}`
            : saving
              ? "Saving…"
              : `${t("log.confirmSave")} ${t(`log.${slot}`)}`}
        </Button>
      </div>
    </div>
  );
}
