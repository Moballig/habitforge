import type { SafetyMode, SafetyScreen } from "./types";
import { asianBmiBand, bmi } from "./energy";

/**
 * Safety mode (research §5.5 / FR-SAFETY-01..02).
 * - doctor-first: high-risk screen → no calorie targets, no deficit, no exercise compensation
 * - restricted: softer gates (e.g. underweight) → maintenance only, no deficit plans
 * - normal: full UI including gentle rebalance
 *
 * Deterministic. LLM never sets this.
 */
export function safetyMode(screen: SafetyScreen): SafetyMode {
  // High-risk triggers → doctor-first (deficits OFF, referral card)
  const doctorFirst =
    screen.under18 ||
    screen.age < 18 ||
    screen.pregnancy ||
    screen.insulinOrSulfonylurea ||
    screen.heartOrKidneyDisease ||
    screen.eatingDisorderHistory;

  if (doctorFirst) return "doctor-first";

  // BMI under 18.5 (or flag) → restricted: no deficit plans
  const underweight =
    screen.lowBmi ||
    asianBmiBand(screen.weightKg, screen.heightCm) === "under";

  if (underweight) return "restricted";

  // Explicit low BMI screen flag with measured BMI still low
  if (screen.weightKg > 0 && screen.heightCm > 0 && bmi(screen.weightKg, screen.heightCm) < 18.5) {
    return "restricted";
  }

  return "normal";
}

/** Whether deficit / rebalance planner UI may run. */
export function allowsDeficit(mode: SafetyMode): boolean {
  return mode === "normal";
}

/** Whether exercise-compensation plans may run. */
export function allowsExerciseCompensation(mode: SafetyMode): boolean {
  return mode === "normal";
}

/** Build a SafetyScreen from loose onboarding answers (UI convenience). */
export function screenFromAnswers(a: {
  age: number;
  weightKg: number;
  heightCm: number;
  under18?: boolean;
  pregnancy?: boolean;
  insulinOrSulfonylurea?: boolean;
  heartOrKidneyDisease?: boolean;
  eatingDisorderHistory?: boolean;
}): SafetyScreen {
  const under18 = a.under18 === true || a.age < 18;
  const measuredUnder = a.weightKg > 0 && a.heightCm > 0 && bmi(a.weightKg, a.heightCm) < 18.5;
  return {
    age: a.age,
    weightKg: a.weightKg,
    heightCm: a.heightCm,
    under18,
    pregnancy: a.pregnancy === true,
    lowBmi: a.pregnancy === false ? measuredUnder : measuredUnder,
    insulinOrSulfonylurea: a.insulinOrSulfonylurea === true,
    heartOrKidneyDisease: a.heartOrKidneyDisease === true,
    eatingDisorderHistory: a.eatingDisorderHistory === true,
  };
}
