import { metNetKcalMinutes } from "./energy";
import { ACTIVITY_METS, netKcalRange } from "./mets";

/**
 * Calorie- and weather-aware exercise recommendation (FR-D-05 + FR-H-01).
 * Pure and deterministic — no LLM. Returns the primary option first with at
 * most one alternative; null in doctor-first mode (no burn framing).
 */

export type ExerciseType = "walk" | "cycle" | "home" | "yoga";

export interface ExerciseOption {
  type: ExerciseType;
  minutes: number;
  kcalLow: number;
  kcalHigh: number;
  /** true when the option is an indoor-appropriate activity */
  indoor: boolean;
  labelEn: string;
  labelBn: string;
}

export interface ExerciseRec {
  whyEn: string;
  whyBn: string;
  options: ExerciseOption[];
}

export interface ExerciseInput {
  safetyMode: "normal" | "restricted" | "doctor-first";
  overshootKcal: number;
  toleranceKcal: number;
  planActivityMin: number;
  weightKg: number;
  hour: number;
  indoor: boolean;
}

const LABELS: Record<ExerciseType, { en: string; bn: string }> = {
  walk: { en: "brisk walk", bn: "দ্রুত হাঁটা" },
  cycle: { en: "cycling", bn: "সাইকেল চালানো" },
  home: { en: "stairs / calisthenics", bn: "সিঁড়ি / ব্যায়াম" },
  yoga: { en: "yoga stretch", bn: "যোগ স্ট্রেচ" },
};

const INDOOR_TYPES = new Set<ExerciseType>(["home", "yoga"]);

/** Minutes of walking to net ~60% of the overshoot, clamped to 10–45. */
export function offsetMinutes(overshootKcal: number, weightKg: number): number {
  const kg = weightKg > 0 ? weightKg : 65;
  const perMin = metNetKcalMinutes(ACTIVITY_METS.walk, kg, 1);
  return Math.min(45, Math.max(10, Math.round((overshootKcal * 0.6) / perMin)));
}

function option(type: ExerciseType, minutes: number, weightKg: number): ExerciseOption {
  const kg = weightKg > 0 ? weightKg : 65;
  const { low, high } = netKcalRange(ACTIVITY_METS[type], kg, minutes);
  return {
    type,
    minutes,
    kcalLow: low,
    kcalHigh: high,
    indoor: INDOOR_TYPES.has(type),
    labelEn: LABELS[type].en,
    labelBn: LABELS[type].bn,
  };
}

export function exerciseRec(input: ExerciseInput): ExerciseRec | null {
  const { safetyMode, overshootKcal, toleranceKcal, planActivityMin, weightKg, hour, indoor } =
    input;
  if (safetyMode === "doctor-first") return null;

  const kg = weightKg > 0 ? weightKg : 65;
  const over = safetyMode === "normal" && overshootKcal > toleranceKcal;
  const minutes = over
    ? offsetMinutes(overshootKcal, kg)
    : Math.min(60, planActivityMin > 0 ? planActivityMin : 15);

  const why =
    over
      ? {
          en: `Gentle offset for today's ~${overshootKcal} kcal`,
          bn: `আজকের ~${overshootKcal} ক্যালোরি মোচনে কোমল পদক্ষেপ`,
        }
      : safetyMode === "restricted"
        ? {
            en: "Optional movement — maintenance mode",
            bn: "ঐচ্ছিক গতিবিধি — মেইনটেন্যান্স মোড",
          }
        : { en: "Keeps the week steady", bn: "সপ্তাহকে স্থিতিশীল রাখে" };

  const types: ExerciseType[] = indoor
    ? ["home", "yoga"]
    : over
      ? ["walk", "cycle"]
      : hour >= 18
        ? ["walk", "yoga"]
        : ["walk", "cycle"];

  return { whyEn: why.en, whyBn: why.bn, options: types.map((ty) => option(ty, minutes, kg)) };
}
