"use client";

import { useAction, useMutation, useQuery, api } from "@/lib/client/api";
import { useRouter } from "next/navigation";
import { useMemo, useState, useSyncExternalStore } from "react";
import { Camera, Mic, ScanBarcode, Search } from "lucide-react";
import { useI18n } from "@/lib/i18n";
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

  const yesterdayISO = useSyncExternalStore(
    () => () => {},
    () => {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      return d.toISOString().slice(0, 10);
    },
    () => "",
  );

  const recentMeals = useQuery(api.mealLogs.listRecent, { limit: 10 });
  const yesterdayMeals = useQuery(
    api.mealLogs.listByDate,
    yesterdayISO ? { date: yesterdayISO } : "skip",
  );

  const [recentSheetOpen, setRecentSheetOpen] = useState(false);
  const [favSheetOpen, setFavSheetOpen] = useState(false);
  const [copyMealSheetOpen, setCopyMealSheetOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  const favouriteFoods = useMemo(() => {
    const staples = ["bhat", "dal", "dim", "roti", "rui", "murgi", "alu bhorta", "cha"];
    const res: FoodItem[] = [];
    for (const s of staples) {
      const found = searchFoods(s)[0];
      if (found && !res.some((x) => x.id === found.id)) {
        res.push(found);
      }
    }
    return res;
  }, []);

  function selectFood(f: FoodItem) {
    setPicked(f);
    setUnit(f.measures[0]?.label ?? "portion");
    setQty(1);
    setSheetOpen(true);
  }

  function handleSameYesterday() {
    if (!yesterdayMeals || yesterdayMeals.length === 0) {
      setToastMessage("No meals recorded yesterday");
      setToast(true);
      setTimeout(() => setToast(false), 2500);
      return;
    }
    const matching = yesterdayMeals.filter((m) => m.slot === slot);
    const mealsToCopy = matching.length > 0 ? matching : yesterdayMeals;
    const itemsToCopy: LoggedItem[] = mealsToCopy.flatMap((m) =>
      m.items.map((i) => ({
        foodId: (i.foodId as string) ?? `${i.nameEn}-${Math.random()}`,
        nameBn: i.nameBn,
        nameEn: i.nameEn,
        quantity: i.quantity,
        unit: i.unit,
        grams: i.grams,
        kcalLow: i.kcalLow,
        kcalHigh: i.kcalHigh,
        sourceTag: i.sourceTag,
      })),
    );
    setPending((cur) => [...cur, ...itemsToCopy]);
    setToastMessage(`Copied ${itemsToCopy.length} item(s) from yesterday!`);
    setToast(true);
    setTimeout(() => setToast(false), 2500);
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

  async function deleteMeal(id: Id<"mealLogs"> | string) {
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
        <Chip onClick={() => setRecentSheetOpen(true)}>{t("log.recents")}</Chip>
        <Chip onClick={() => setFavSheetOpen(true)}>{t("log.favourites")}</Chip>
        <Chip onClick={handleSameYesterday}>{t("log.sameYesterday")}</Chip>
        <Chip onClick={() => setCopyMealSheetOpen(true)}>{t("log.copyMeal")}</Chip>
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
          {toastMessage ?? t("states.saved")}
        </div>
      )}

      {/* Recents Sheet */}
      <Sheet
        open={recentSheetOpen}
        onClose={() => setRecentSheetOpen(false)}
        title={t("log.recents")}
      >
        <div className="space-y-3">
          {!recentMeals || recentMeals.length === 0 ? (
            <NoticeCard
              tone="info"
              title="No recent meals"
              body="Meals you log will appear here for fast re-logging."
            />
          ) : (
            recentMeals.map((m) => (
              <div key={m._id} className="tile space-y-2 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-ink/50">
                    {m.date} · {m.slot}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const itemsToCopy: LoggedItem[] = m.items.map((i) => ({
                        foodId: (i.foodId as string) ?? `${i.nameEn}-${Math.random()}`,
                        nameBn: i.nameBn,
                        nameEn: i.nameEn,
                        quantity: i.quantity,
                        unit: i.unit,
                        grams: i.grams,
                        kcalLow: i.kcalLow,
                        kcalHigh: i.kcalHigh,
                        sourceTag: i.sourceTag,
                      }));
                      setPending((cur) => [...cur, ...itemsToCopy]);
                      setRecentSheetOpen(false);
                      setToastMessage(`Added ${itemsToCopy.length} items from ${m.slot} to pending`);
                      setToast(true);
                      setTimeout(() => setToast(false), 2500);
                    }}
                    className="rounded-full bg-surface-soft px-3 py-1 text-xs font-bold text-violet hover:bg-violet hover:text-white"
                  >
                    + Add to pending
                  </button>
                </div>
                <p className="text-sm font-semibold">
                  {m.items.map((i) => `${i.nameEn} (${i.quantity} ${i.unit})`).join(", ")}
                </p>
              </div>
            ))
          )}
        </div>
      </Sheet>

      {/* Favourites Sheet */}
      <Sheet
        open={favSheetOpen}
        onClose={() => setFavSheetOpen(false)}
        title={t("log.favourites")}
      >
        <div className="space-y-3">
          <p className="text-xs text-ink/60">
            Frequently eaten Deshi staples. Tap to select portions:
          </p>
          <ul className="space-y-2">
            {favouriteFoods.map((f) => (
              <li key={f.id}>
                <button
                  type="button"
                  onClick={() => {
                    setFavSheetOpen(false);
                    selectFood(f);
                  }}
                  className="tile flex w-full items-center justify-between gap-3 p-3 text-left transition hover:bg-surface-soft"
                >
                  <div>
                    <p className="text-sm font-bold">{f.nameBn}</p>
                    <p className="text-xs text-ink/50">{f.nameEn}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-xs font-semibold text-ink/55">
                      ~{Math.round(f.kcalPer100 * ((f.measures[0]?.grams ?? 100) / 100))} kcal
                    </span>
                    <SourceTag tag={f.sourceTag} />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </Sheet>

      {/* Copy Meal Sheet */}
      <Sheet
        open={copyMealSheetOpen}
        onClose={() => setCopyMealSheetOpen(false)}
        title={t("log.copyMeal")}
      >
        <div className="space-y-3">
          <p className="text-xs text-ink/60">
            Duplicate a previous meal into today&apos;s {t(`log.${slot}`)}:
          </p>
          {!recentMeals || recentMeals.length === 0 ? (
            <NoticeCard
              tone="info"
              title="No previous meals"
              body="Log a meal first, then you can quickly copy it to other days."
            />
          ) : (
            recentMeals.map((m) => (
              <div
                key={m._id}
                className="tile flex items-center justify-between gap-3 p-3"
              >
                <div className="min-w-0">
                  <span className="text-xs font-bold uppercase text-ink/50">
                    {m.date} · {m.slot}
                  </span>
                  <p className="truncate text-sm font-semibold">
                    {m.items.map((i) => i.nameEn).join(", ")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const itemsToCopy: LoggedItem[] = m.items.map((i) => ({
                      foodId: (i.foodId as string) ?? `${i.nameEn}-${Math.random()}`,
                      nameBn: i.nameBn,
                      nameEn: i.nameEn,
                      quantity: i.quantity,
                      unit: i.unit,
                      grams: i.grams,
                      kcalLow: i.kcalLow,
                      kcalHigh: i.kcalHigh,
                      sourceTag: i.sourceTag,
                    }));
                    setPending((cur) => [...cur, ...itemsToCopy]);
                    setCopyMealSheetOpen(false);
                    setToastMessage(`Copied meal into ${t(`log.${slot}`)}`);
                    setToast(true);
                    setTimeout(() => setToast(false), 2500);
                  }}
                  className="shrink-0 rounded-full bg-violet px-3 py-1.5 text-xs font-bold text-white hover:opacity-90"
                >
                  Copy
                </button>
              </div>
            ))
          )}
        </div>
      </Sheet>

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
