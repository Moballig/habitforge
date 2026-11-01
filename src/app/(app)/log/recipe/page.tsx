"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { Button, Field } from "@/components/forms/Forms";
import { Chip, Range, SectionLabel, SourceTag } from "@/components/data/Primitives";
import { NoticeCard } from "@/components/shell/Banners";

type Ingredient = { id: string; label: string; kcalPerUnit: number; unit: string };

// Demo ingredient table — Wave 3 replaces with FCTB-backed lib/engine recipe math.
const INGREDIENTS: Ingredient[] = [
  { id: "rice", label: "ভাত / Rice", kcalPerUnit: 260, unit: "bati" },
  { id: "dal", label: "ডাল / Dal", kcalPerUnit: 150, unit: "bowl" },
  { id: "oil", label: "তেল / Oil", kcalPerUnit: 120, unit: "tbsp" },
  { id: "potato", label: "আলু / Potato", kcalPerUnit: 80, unit: "medium" },
  { id: "egg", label: "ডিম / Egg", kcalPerUnit: 78, unit: "piece" },
  { id: "chicken", label: "মুরগি / Chicken", kcalPerUnit: 165, unit: "piece" },
];

export default function RecipeBuilderPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [servings, setServings] = useState(3);
  const [picked, setPicked] = useState<Record<string, number>>({ rice: 3, dal: 2, oil: 2 });
  const [saved, setSaved] = useState(false);

  const total = useMemo(
    () =>
      Object.entries(picked).reduce((s, [id, qty]) => {
        const ing = INGREDIENTS.find((i) => i.id === id);
        return s + (ing ? ing.kcalPerUnit * qty : 0);
      }, 0),
    [picked],
  );
  const perServing = servings > 0 ? total / servings : 0;

  function bump(id: string, delta: number) {
    setPicked((p) => {
      const next = Math.max(0, (p[id] ?? 0) + delta);
      const copy = { ...p };
      if (next === 0) delete copy[id];
      else copy[id] = next;
      return copy;
    });
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold md:text-3xl">{t("log.recipe")}</h1>
        <p className="mt-1 text-sm text-ink/55">Build a shared-pot recipe with per-serving ranges.</p>
      </header>

      <section>
        <SectionLabel>Ingredients</SectionLabel>
        <ul className="space-y-2">
          {INGREDIENTS.map((ing) => {
            const qty = picked[ing.id] ?? 0;
            return (
              <li
                key={ing.id}
                className={`tile flex items-center justify-between gap-3 p-3 ${qty > 0 ? "ring-1 ring-violet" : ""}`}
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold">{ing.label}</p>
                  <p className="text-xs text-ink/50">
                    {ing.kcalPerUnit} kcal / {ing.unit}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    aria-label={`Less ${ing.label}`}
                    onClick={() => bump(ing.id, -1)}
                    className="h-10 w-10 rounded-full bg-surface-soft font-bold"
                  >
                    −
                  </button>
                  <span className="font-num w-6 text-center font-extrabold tabular">{qty}</span>
                  <button
                    type="button"
                    aria-label={`More ${ing.label}`}
                    onClick={() => bump(ing.id, 1)}
                    className="h-10 w-10 rounded-full bg-surface-soft font-bold"
                  >
                    +
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="card space-y-4 p-5">
        <Field label="Servings" htmlFor="servings">
          <div className="flex gap-2">
            {[2, 3, 4, 6].map((n) => (
              <Chip key={n} selected={servings === n} onClick={() => setServings(n)}>
                {n}
              </Chip>
            ))}
          </div>
        </Field>
        <div className="rounded-tile bg-mint px-4 py-3 text-mint-ink">
          <p className="text-xs font-semibold opacity-70">Per serving</p>
          <p className="font-num text-2xl font-extrabold tabular">
            <Range low={Math.round(perServing * 0.9)} high={Math.round(perServing * 1.12)} />
          </p>
          <p className="mt-1 text-xs opacity-80">pot total ≈ {Math.round(total)} kcal</p>
          <div className="mt-2 flex gap-2">
            <SourceTag tag="estimated-recipe" />
            <SourceTag tag="user" />
          </div>
        </div>
      </section>

      <NoticeCard
        tone="info"
        title={t("log.sharedPot")}
        body="Shared-pot cooking divides evenly. Adjust shares later if portions differ."
      />

      <div className="flex gap-3">
        <Button variant="secondary" onClick={() => router.back()}>
          {t("common.back")}
        </Button>
        <Button full disabled={saved || total === 0} onClick={() => setSaved(true)}>
          {saved ? `✓ ${t("states.saved")}` : t("common.save")}
        </Button>
      </div>
    </div>
  );
}
