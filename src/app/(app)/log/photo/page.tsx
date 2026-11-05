"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { useAction, useMutation, api } from "@/lib/client/api";
import { Camera, RefreshCw, Upload } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/forms/Forms";
import { Chip, Range, SectionLabel, SourceTag } from "@/components/data/Primitives";
import { NoticeCard } from "@/components/shell/Banners";
import { useRouter } from "next/navigation";
import { compressImage } from "@/lib/ai/photo";
import { portionClassToGrams, type PortionClass } from "@/lib/foods/portion";
import {
  getOfflineFood,
  OFFLINE_FOODS,
  toLoggedItemFromGrams,
  todayISO,
} from "@/lib/foods/search";
import type { MealSlot } from "@/lib/types";

type PhotoItem = {
  foodId: string;
  nameBn: string;
  nameEn: string;
  confidence: number;
  portion: PortionClass;
};

const PORTIONS: PortionClass[] = ["small", "medium", "large"];

const SLOTS: { id: MealSlot; key: string }[] = [
  { id: "breakfast", key: "log.breakfast" },
  { id: "lunch", key: "log.lunch" },
  { id: "snacks", key: "log.snacks" },
  { id: "dinner", key: "log.dinner" },
];

function confBand(confidence: number): "high" | "medium" | "low" {
  if (confidence >= 0.8) return "high";
  if (confidence >= 0.5) return "medium";
  return "low";
}

export default function PhotoLogPage() {
  const { t } = useI18n();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  // Client-only date; server snapshot is "" so prerender never calls new Date()
  const date = useSyncExternalStore(
    () => () => {},
    () => todayISO(),
    () => "",
  );
  const analyzePhoto = useAction(api.ai.analyzePhoto);
  const createMeal = useMutation(api.mealLogs.create);

  const [preview, setPreview] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const [items, setItems] = useState<PhotoItem[]>([]);
  const [picked, setPicked] = useState<string[]>([]);
  const [slot, setSlot] = useState<MealSlot>("lunch");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setPreview(URL.createObjectURL(f));
    setItems([]);
    setPicked([]);
    setSaved(false);
    setError(null);
    setReading(true);
    try {
      const data = await compressImage(f);
      const result = await analyzePhoto({
        images: [data],
        candidates: OFFLINE_FOODS.map((food) => ({
          id: food.id,
          nameBn: food.nameBn,
          nameEn: food.nameEn,
        })),
      });
      if (result.error || !result.items) {
        throw new Error(result.error ?? "No foods recognized");
      }
      const resolved: PhotoItem[] = result.items.flatMap((hit) => {
        const food = getOfflineFood(hit.foodId);
        if (!food) return [];
        return [
          {
            foodId: hit.foodId,
            nameBn: food.nameBn,
            nameEn: food.nameEn,
            confidence: hit.confidence,
            portion: hit.portionClass,
          },
        ];
      });
      if (resolved.length === 0) throw new Error("No recognizable foods found");
      setItems(resolved);
      setPicked(resolved.map((item) => item.foodId));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setReading(false);
    }
  }

  function toggle(foodId: string) {
    setPicked((p) => (p.includes(foodId) ? p.filter((x) => x !== foodId) : [...p, foodId]));
  }

  function setPortion(foodId: string, portion: PortionClass) {
    setItems((list) =>
      list.map((item) => (item.foodId === foodId ? { ...item, portion } : item)),
    );
  }

  const selected = items
    .filter((item) => picked.includes(item.foodId))
    .flatMap((item) => {
      const food = getOfflineFood(item.foodId);
      if (!food) return [];
      const { grams, label } = portionClassToGrams(food, item.portion);
      return [toLoggedItemFromGrams(food, grams, label)];
    });
  const low = selected.reduce((s, g) => s + g.kcalLow, 0);
  const high = selected.reduce((s, g) => s + g.kcalHigh, 0);

  async function save() {
    if (selected.length === 0 || saving || !date) return;
    setSaving(true);
    try {
      await createMeal({
        date,
        slot,
        method: "photo",
        items: selected.map((item) => ({
          nameBn: item.nameBn,
          nameEn: item.nameEn,
          quantity: item.quantity,
          unit: item.unit,
          grams: item.grams,
          kcalLow: item.kcalLow,
          kcalHigh: item.kcalHigh,
          sourceTag: item.sourceTag,
        })),
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
        <h1 className="text-2xl font-extrabold md:text-3xl">{t("log.photo")}</h1>
        <p className="mt-1 text-sm text-ink/55">{t("log.reading")}</p>
      </header>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onFile}
        className="sr-only"
      />

      {!preview ? (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-3 rounded-card border-2 border-dashed border-border bg-surface-soft text-ink/50 transition hover:border-violet hover:text-violet"
        >
          <Camera size={40} />
          <span className="text-sm font-bold">{t("log.photo")}</span>
          <span className="text-xs">tap to open camera</span>
        </button>
      ) : (
        <div className="overflow-hidden rounded-card">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Your plate" className="aspect-[4/3] w-full object-cover" />
        </div>
      )}

      <div className="flex gap-2">
        <Button variant="secondary" full onClick={() => fileRef.current?.click()}>
          <RefreshCw size={15} /> Retake
        </Button>
        <Button variant="secondary" full onClick={() => fileRef.current?.click()}>
          <Upload size={15} /> Gallery
        </Button>
      </div>

      {reading && (
        <div className="flex items-center gap-3 rounded-tile bg-lilac px-4 py-3 text-sm font-semibold text-lilac-ink">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          {t("log.reading")}
        </div>
      )}

      {error && (
        <NoticeCard
          tone="error"
          title={t("log.aiEstimate")}
          body={`${error} — you can still log this meal by hand.`}
        />
      )}
      {error && (
        <Button variant="secondary" full onClick={() => router.push("/log")}>
          {t("log.tapPick")}
        </Button>
      )}

      {items.length > 0 && (
        <section>
          <SectionLabel>{t("log.parseTitle")}</SectionLabel>
          <ul className="space-y-2">
            {items.map((g) => {
              const on = picked.includes(g.foodId);
              const food = getOfflineFood(g.foodId);
              const { grams, label } = food
                ? portionClassToGrams(food, g.portion)
                : { grams: 0, label: g.portion };
              const logged = food ? toLoggedItemFromGrams(food, grams, label) : null;
              return (
                <li key={g.foodId} className="card p-4">
                  <button
                    type="button"
                    onClick={() => toggle(g.foodId)}
                    aria-pressed={on}
                    className="flex w-full items-center justify-between gap-3 text-left"
                  >
                    <div>
                      <p className="font-bold">
                        {on ? "✓ " : ""}
                        {g.nameBn}{" "}
                        <span className="text-sm font-medium text-ink/50">{g.nameEn}</span>
                      </p>
                      <div className="mt-1 flex gap-2">
                        <SourceTag tag="ai-assisted" />
                        <span className="text-[11px] font-semibold text-ink/45">
                          conf: {confBand(g.confidence)}
                        </span>
                      </div>
                    </div>
                    {logged && (
                      <Range
                        low={logged.kcalLow}
                        high={logged.kcalHigh}
                        className="shrink-0 text-sm font-bold"
                      />
                    )}
                  </button>
                  {on && (
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-ink/45">
                        {t("log.portion")}
                      </span>
                      {PORTIONS.map((p) => (
                        <Chip
                          key={p}
                          selected={g.portion === p}
                          onClick={() => setPortion(g.foodId, p)}
                        >
                          {p}
                        </Chip>
                      ))}
                      <span className="ml-auto text-xs font-semibold text-ink/45">
                        {grams} g
                      </span>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          <NoticeCard
            tone="gentle"
            title={t("log.aiEstimate")}
            body="Tap items to include or exclude. Adjust portions with the chips — calories update live."
          />
        </section>
      )}

      {items.length > 0 && (
        <div className="space-y-3">
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
            <Button
              full
              disabled={selected.length === 0 || saved || saving}
              onClick={save}
            >
              {saved
                ? `✓ ${t("states.saved")}`
                : saving
                  ? "Saving…"
                  : `${t("log.confirmSave")} ${t(`log.${slot}`)} (${low}–${high} kcal)`}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
