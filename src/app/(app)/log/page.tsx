"use client";

import { useAction, useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useSyncExternalStore } from "react";
import { Camera, Mic, ScanBarcode, Search } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import {
  getOfflineFood,
  searchFoods,
  toLoggedItem,
  toLoggedItemFromGrams,
  todayISO,
} from "@/lib/foods/search";
import {
  getMealCandidatePool,
  parseMealLineLocal,
  resolveMealUnit,
} from "@/lib/foods/parser";
import { sharedPotGrams } from "@/lib/foods/portion";
import type { FoodItem, LoggedItem, MealSlot } from "@/lib/types";
import { Chip, Range, SectionLabel, SourceTag } from "@/components/data/Primitives";
import { TabBar } from "@/components/data/Cards";
import { Button, Sheet, StepperInput } from "@/components/forms/Forms";
import { NoticeCard } from "@/components/shell/Banners";
import { formatKcal } from "@/lib/format";

const SLOTS: { id: MealSlot; key: string }[] = [
  { id: "breakfast", key: "log.breakfast" },
  { id: "lunch", key: "log.lunch" },
  { id: "snacks", key: "log.snacks" },
  { id: "dinner", key: "log.dinner" },
];

export default function LogPage() {
  const { t } = useI18n();
  const router = useRouter();
  // Client-only date; server snapshot is "" so prerender never calls new Date()
  const date = useSyncExternalStore(
    () => () => {},
    () => todayISO(),
    () => "",
  );

  const meals = useQuery(api.mealLogs.listByDate, date ? { date } : "skip");
  const createMeal = useMutation(api.mealLogs.create);
  const removeMeal = useMutation(api.mealLogs.remove);
  const parseMeal = useAction(api.ai.parseMeal);

  const [query, setQuery] = useState("");
  const [slot, setSlot] = useState<MealSlot>("lunch");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [picked, setPicked] = useState<FoodItem | null>(null);
  const [unit, setUnit] = useState("");
  const [qty, setQty] = useState(1);
  const [sharedPot, setSharedPot] = useState(false);
  const [potGrams, setPotGrams] = useState(1000);
  const [shareDenominator, setShareDenominator] = useState(5);
  const [pending, setPending] = useState<LoggedItem[]>([]);
  const [toast, setToast] = useState(false);
  const [saving, setSaving] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parseMessage, setParseMessage] = useState<string | null>(null);

  const candidates = useMemo(() => searchFoods(query), [query]);

  function selectFood(f: FoodItem) {
    setPicked(f);
    setUnit(f.measures[0]?.label ?? "portion");
    setQty(1);
    setSheetOpen(true);
  }

  function confirmAdd() {
    if (!picked) return;
    const item = sharedPot
      ? toLoggedItemFromGrams(
          picked,
          sharedPotGrams(potGrams, 1, shareDenominator),
          `1/${shareDenominator} pot`,
        )
      : toLoggedItem(picked, qty, unit);
    setPending((s) => [...s, item]);
    setSheetOpen(false);
    setPicked(null);
    setQuery("");
    setToast(true);
    setTimeout(() => setToast(false), 2500);
  }

  async function confirmSave() {
    if (pending.length === 0 || saving || !date) return;
    setSaving(true);
    try {
      await createMeal({
        date,
        slot,
        items: pending.map((i) => ({
          nameBn: i.nameBn,
          nameEn: i.nameEn,
          quantity: i.quantity,
          unit: i.unit,
          grams: i.grams,
          kcalLow: i.kcalLow,
          kcalHigh: i.kcalHigh,
          sourceTag: i.sourceTag,
        })),
        method: "text",
      });
      setPending([]);
      setToast(true);
      setTimeout(() => setToast(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  async function parseLine() {
    const line = query.trim();
    if (!line || parsing) return;
    const localPicks = parseMealLineLocal(line);
    const pool = getMealCandidatePool(line);
    if (pool.length === 0) {
      setParseMessage(t("log.noCandidates"));
      return;
    }

    setParsing(true);
    setParseMessage(null);
    try {
      const result = await parseMeal({
        line,
        candidates: pool.map((food) => ({
          id: food.id,
          nameBn: food.nameBn,
          nameEn: food.nameEn,
          aliases: food.aliases,
        })),
      });
      const parsedItems = (result.picks ?? []).flatMap((pick) => {
        const food = getOfflineFood(pick.id);
        if (!food) return [];
        const unit = resolveMealUnit(
          food,
          pick.unit === "default" ? undefined : pick.unit,
        );
        return [toLoggedItem(food, pick.qty, unit)];
      });
      if (parsedItems.length > 0) {
        setPending((items) => [...items, ...parsedItems]);
        setParseMessage(t("log.parsed"));
      } else {
        throw new Error(result.error ?? "No valid picks");
      }
    } catch {
      const fallback = localPicks.map(({ food, quantity, unit }) =>
        toLoggedItem(food, quantity, unit),
      );
      if (fallback.length > 0) {
        setPending((items) => [...items, ...fallback]);
        setParseMessage(t("log.offlineParsed"));
      } else {
        setParseMessage(t("log.noCandidates"));
      }
    } finally {
      setParsing(false);
      setQuery("");
    }
  }

  async function deleteMeal(id: Id<"mealLogs">) {
    await removeMeal({ id });
  }

  const pendingKcalLow = pending.reduce((s, i) => s + i.kcalLow, 0);
  const pendingKcalHigh = pending.reduce((s, i) => s + i.kcalHigh, 0);

  const todayKcalLow = (meals ?? []).reduce(
    (s, m) => s + m.items.reduce((a, i) => a + i.kcalLow, 0),
    0,
  );
  const todayKcalHigh = (meals ?? []).reduce(
    (s, m) => s + m.items.reduce((a, i) => a + i.kcalHigh, 0),
    0,
  );
  const previewItem = picked
    ? sharedPot
      ? toLoggedItemFromGrams(
          picked,
          sharedPotGrams(potGrams, 1, shareDenominator),
          `1/${shareDenominator} pot`,
        )
      : toLoggedItem(picked, qty, unit)
    : null;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold md:text-3xl">{t("log.title")}</h1>
        <p className="mt-1 text-sm text-ink/55">
          Today · <Range low={todayKcalLow} high={todayKcalHigh} /> kcal
        </p>
      </header>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40" aria-hidden />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void parseLine();
              }
            }}
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

      {query.trim() && (
        <Button full disabled={parsing} onClick={() => void parseLine()}>
          {parsing ? t("log.parsing") : t("log.parseLine")}
        </Button>
      )}

      {parseMessage && (
        <NoticeCard tone="info" title={t("log.parseTitle")} body={parseMessage} />
      )}

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
          {(meals ?? []).map((m) => (
            <li key={m._id} className="tile p-4">
              <div className="flex items-center justify-between">
                <p className="font-bold capitalize">{m.slot}</p>
                <div className="flex items-center gap-2">
                  <span className="font-num text-sm font-bold tabular text-ink/60">
                    {formatKcal(m.items.reduce((s, i) => s + i.kcalLow, 0))}–
                    {formatKcal(m.items.reduce((s, i) => s + i.kcalHigh, 0))} kcal
                  </span>
                  <button
                    type="button"
                    aria-label="Delete meal"
                    onClick={() => void deleteMeal(m._id)}
                    className="text-xs font-bold text-ink/40 hover:text-ink/70"
                  >
                    ✕
                  </button>
                </div>
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
          {meals && meals.length === 0 && pending.length === 0 && (
            <NoticeCard tone="info" title="Nothing logged yet" body="Search a food above to get started." />
          )}
        </ul>

        {pending.length > 0 && (
          <div className="mt-3 space-y-2">
            <div className="tile p-4">
              <div className="flex items-center justify-between">
                <p className="font-bold capitalize">Pending · {slot}</p>
                <span className="font-num text-sm font-bold tabular text-ink/60">
                  {formatKcal(pendingKcalLow)}–{formatKcal(pendingKcalHigh)} kcal
                </span>
              </div>
              <ul className="mt-2 space-y-1.5">
                {pending.map((i, idx) => (
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
            </div>
            <Button full disabled={saving} onClick={() => void confirmSave()}>
              {saving ? "Saving…" : `${t("common.save")} · ${t(`log.${slot}`)}`}
            </Button>
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
            {sharedPot ? (
              <div className="space-y-4">
                <p className="text-sm text-ink/60">{t("log.sharedPotHint")}</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <StepperInput
                    label={t("log.potWeight")}
                    value={potGrams}
                    unit="g"
                    onChange={setPotGrams}
                    min={100}
                    max={5000}
                    step={50}
                  />
                  <StepperInput
                    label={t("log.myShare")}
                    value={shareDenominator}
                    onChange={setShareDenominator}
                    min={1}
                    max={20}
                  />
                </div>
              </div>
            ) : (
              <>
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
              </>
            )}
            {previewItem && (
              <div className="tile p-4">
                <p className="text-xs font-semibold text-ink/50">Result</p>
                <p className="font-num mt-1 text-2xl font-extrabold tabular">
                  <Range low={previewItem.kcalLow} high={previewItem.kcalHigh} />
                </p>
                <p className="mt-1 text-sm text-ink/55">{previewItem.grams} g</p>
                <div className="mt-2 flex gap-2">
                  <SourceTag tag={picked.sourceTag} />
                  <button type="button" className="text-xs font-bold underline text-ink/50">
                    {t("log.reportWrong")}
                  </button>
                </div>
              </div>
            )}
            <Button full onClick={confirmAdd}>
              Add to {t(`log.${slot}`)}
            </Button>
          </div>
        )}
      </Sheet>
    </div>
  );
}
