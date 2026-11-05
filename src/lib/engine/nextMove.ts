import { exerciseRec, type ExerciseOption } from "./exercise";

/**
 * Calorie-driven "what should I do next" recommender for Home (FR-H-01
 * enrichment). Pure and deterministic: inputs are today's numbers, output is
 * one gentle next move — food, exercise, steady, or rest. No LLM (FR-G-06).
 */

export type NextMoveKind = "eat" | "move" | "steady" | "rest";

export interface NextMoveInput {
  safetyMode: "normal" | "restricted" | "doctor-first";
  targetKcal: number;
  eatenLow: number;
  eatenHigh: number;
  overshootKcal: number;
  toleranceKcal: number;
  bySlot: { breakfast: number; lunch: number; snacks: number; dinner: number };
  plate: { veg: number; protein: number; grains: number; other: number };
  planActivityMin: number;
  weightKg: number;
  hour: number;
  indoor: boolean;
  womenFriendly?: boolean;
}

export interface NextMoveFood {
  nameEn: string;
  nameBn: string;
  kcalLow: number;
  kcalHigh: number;
  whyEn: string;
  whyBn: string;
}

export interface NextMove {
  kind: NextMoveKind;
  headlineEn: string;
  headlineBn: string;
  detailEn: string;
  detailBn: string;
  food?: NextMoveFood;
  /** Primary option first; absent in doctor-first and rest states. */
  exercise?: ExerciseOption[];
  cta: "log" | "activity" | "plan" | null;
}

type Slot = "breakfast" | "lunch" | "dinner";
type Focus = "protein" | "veg" | "staple";

interface FoodOption {
  nameEn: string;
  nameBn: string;
  kcalLow: number;
  kcalHigh: number;
  focus: Focus;
}

const FOODS: Record<Slot, FoodOption[]> = {
  breakfast: [
    { nameEn: "Khichuri with egg", nameBn: "খিচুড়ি ও ডিম", kcalLow: 350, kcalHigh: 450, focus: "staple" },
    { nameEn: "Ruti with dim & shak", nameBn: "রুটি, ডিম ও শাক", kcalLow: 300, kcalHigh: 400, focus: "protein" },
    { nameEn: "Ruti with shak & dal", nameBn: "রুটি, শাক ও ডাল", kcalLow: 280, kcalHigh: 380, focus: "veg" },
  ],
  lunch: [
    { nameEn: "Rice, dal & small fish", nameBn: "ভাত, ডাল ও মাছ", kcalLow: 450, kcalHigh: 600, focus: "protein" },
    { nameEn: "Rice, dal & shak", nameBn: "ভাত, ডাল ও শাক", kcalLow: 400, kcalHigh: 520, focus: "veg" },
    { nameEn: "Rice & egg curry", nameBn: "ভাত ও ডিম ভাজি", kcalLow: 420, kcalHigh: 540, focus: "staple" },
  ],
  dinner: [
    { nameEn: "Rice, dal & egg curry", nameBn: "ভাত, ডাল ও ডিম ভাজি", kcalLow: 350, kcalHigh: 500, focus: "protein" },
    { nameEn: "Dal, shak & ruti", nameBn: "ডাল, শাক ও রুটি", kcalLow: 300, kcalHigh: 420, focus: "veg" },
    { nameEn: "Khichuri", nameBn: "খিচুড়ি", kcalLow: 320, kcalHigh: 430, focus: "staple" },
  ],
};

/** Slot due by time of day; falls back through the rest of the day. */
function dueSlot(hour: number, bySlot: NextMoveInput["bySlot"]): Slot | null {
  const order: Slot[] =
    hour < 11
      ? ["breakfast", "lunch", "dinner"]
      : hour < 16
        ? ["lunch", "dinner", "breakfast"]
        : ["dinner", "breakfast", "lunch"];
  for (const slot of order) if (!bySlot[slot]) return slot;
  return null;
}

function weakestFocus(plate: NextMoveInput["plate"]): Focus | null {
  const total = plate.veg + plate.protein + plate.grains;
  if (total === 0) return null;
  const entries: [Focus, number][] = [
    ["protein", plate.protein],
    ["veg", plate.veg],
    ["staple", plate.grains],
  ];
  entries.sort((a, b) => a[1] - b[1]);
  return entries[0][0];
}

function pickFood(slot: Slot, plate: NextMoveInput["plate"]): FoodOption {
  const options = FOODS[slot];
  const focus = weakestFocus(plate);
  return (focus && options.find((o) => o.focus === focus)) || options[0];
}

export function nextMove(input: NextMoveInput): NextMove {
  const {
    safetyMode,
    targetKcal,
    eatenLow,
    eatenHigh,
    overshootKcal,
    toleranceKcal,
    bySlot,
    plate,
    planActivityMin,
    weightKg,
    hour,
    indoor,
  } = input;
  const remaining = Math.round(targetKcal - (eatenLow + eatenHigh) / 2);
  const over = overshootKcal > toleranceKcal;
  const due = dueSlot(hour, bySlot);
  const ex = exerciseRec({
    safetyMode,
    overshootKcal,
    toleranceKcal,
    planActivityMin,
    weightKg,
    hour,
    indoor,
    womenFriendly: input.womenFriendly,
  });

  if (safetyMode === "doctor-first") {
    return {
      kind: "rest",
      headlineEn: "Follow your clinician's advice",
      headlineBn: "ডাক্তারের পরামর্শ অনুসরণ করুন",
      detailEn: "Log meals if you like — no calorie targets here.",
      detailBn: "ইচ্ছে করলে খাবার লিখুন — এখানে কোনো ক্যালোরি লক্ষ্য নেই।",
      cta: "log",
    };
  }

  const foodRow = due
    ? (() => {
        const f = pickFood(due, plate);
        return {
          nameEn: f.nameEn,
          nameBn: f.nameBn,
          kcalLow: f.kcalLow,
          kcalHigh: f.kcalHigh,
          whyEn:
            over || safetyMode === "restricted"
              ? "eat the next meal normally — no skipping"
              : `fits your ~${remaining} kcal remaining`,
          whyBn:
            over || safetyMode === "restricted"
              ? "পরের খাবার স্বাভাবিক খান — বাদ দেবেন না"
              : `আপনার ~${remaining} ক্যালোরি বাকিতে মানানসই`,
        } satisfies NextMoveFood;
      })()
    : undefined;

  if (over && safetyMode === "normal") {
    return {
      kind: "move",
      headlineEn: `~${overshootKcal} kcal over today`,
      headlineBn: `আজ ~${overshootKcal} ক্যালোরি বেশি`,
      detailEn: "Use the exercise card to gently spread it — or open the Plan.",
      detailBn: "ধীরে ছড়াতে ব্যায়াম কার্ড ব্যবহার করুন — অথবা প্লান খুলুন।",
      ...(foodRow ? { food: foodRow } : {}),
      ...(ex ? { exercise: ex.options } : {}),
      cta: "activity",
    };
  }

  if (over && safetyMode === "restricted") {
    return {
      kind: "steady",
      headlineEn: "A bigger day than planned",
      headlineBn: "পরিকল্পনার চেয়ে বড় দিন",
      detailEn: "Maintenance mode: no deficit plans. See the Plan to spread it gently.",
      detailBn: "মেইনটেন্যান্স মোড: ঘাটতির পরিকল্পনা নেই। ধীরে ছড়াতে প্লান দেখুন।",
      ...(foodRow ? { food: foodRow } : {}),
      ...(ex ? { exercise: ex.options } : {}),
      cta: "plan",
    };
  }

  if (due && remaining >= 300 && hour < 21) {
    const f = foodRow!;
    return {
      kind: "eat",
      headlineEn: `≈${remaining} kcal left today`,
      headlineBn: `আজ ≈${remaining} ক্যালোরি বাকি`,
      detailEn: `${f.nameEn} (${f.kcalLow}–${f.kcalHigh} kcal) fits what's left.`,
      detailBn: `${f.nameBn} (${f.kcalLow}–${f.kcalHigh} ক্যালোরি) বাকি অংশে মানানসই।`,
      food: f,
      ...(ex ? { exercise: ex.options } : {}),
      cta: "log",
    };
  }

  if (hour >= 21 && remaining > 400) {
    return {
      kind: "rest",
      headlineEn: "Enough for today",
      headlineBn: "আজ যথেষ্ট",
      detailEn: "No need to catch up — tomorrow starts fresh.",
      detailBn: "ধরে নেওয়ার দরকার নেই — আগামীকাল নতুন করে শুরু।",
      cta: null,
    };
  }

  return {
    kind: "steady",
    headlineEn: "On track today",
    headlineBn: "আজ ঠিক পথে",
    detailEn:
      remaining > 0
        ? `≈${remaining} kcal left — the exercise card helps keep the week steady.`
        : "Within today's range — the exercise card helps keep the week steady.",
    detailBn:
      remaining > 0
        ? `≈${remaining} ক্যালোরি বাকি — ব্যায়াম কার্ড সপ্তাহ স্থিতিশীল রাখতে সাহায্য করে।`
        : "আজকের সীমার মধ্যে — ব্যায়াম কার্ড সপ্তাহ স্থিতিশীল রাখতে সাহায্য করে।",
    ...(ex ? { exercise: ex.options } : {}),
    cta: "activity",
  };
}
