import type { ActivityLevel, EngineProfile, Sex } from "./types";

/** Mifflin-St Jeor BMR (research §5.1 / FR-ENG-01). */
export function bmr(p: Pick<EngineProfile, "sex" | "weightKg" | "heightCm" | "age">): number {
  const base = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age;
  return p.sex === "male" ? base + 5 : base - 161;
}

/** Standard activity factors for formula TDEE. */
export const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
};

/** TDEE = BMR × activity factor (FR-ENG-02). Replaced over time by adaptive estimate. */
export function tdee(bmrKcal: number, activity: ActivityLevel): number {
  return bmrKcal * ACTIVITY_FACTORS[activity];
}

/**
 * Gross MET energy: MET × kg × hours.
 * Net (for planning extra burn): (MET − 1) × kg × hours (FR-ENG-03).
 * Hand-check: 70 kg, 40 min @ 4.3 MET → net = 3.3 × 70 × (40/60) = 154 kcal.
 */
export function metGrossKcal(met: number, weightKg: number, hours: number): number {
  return met * weightKg * hours;
}

export function metNetKcal(met: number, weightKg: number, hours: number): number {
  return Math.max(0, (met - 1) * weightKg * hours);
}

/** Net kcal for a duration in minutes. */
export function metNetKcalMinutes(met: number, weightKg: number, minutes: number): number {
  return metNetKcal(met, weightKg, minutes / 60);
}

/** Energy per kg of body-weight change (FR-ENG-04). */
export const KCAL_PER_KG = 7700;

/** Daily deficit for a 0.5 kg/week loss (FR-ENG-05 band: ~0.5–1 kg/week). */
export function gentleDeficitKcal(kgPerWeek = 0.5): number {
  return Math.round((KCAL_PER_KG * kgPerWeek) / 7);
}

/** Protein guidance band during a deficit, g/kg/day (FR-ENG-06) — information only. */
export function proteinBandGPerKg(weightKg: number): { low: number; high: number } {
  return { low: Math.round(weightKg * 1.6), high: Math.round(weightKg * 2.2) };
}

/** Asian BMI cut-offs (WHO 2004) — FR-A-03. */
export const ASIAN_BMI_OVERWEIGHT = 23;
export const ASIAN_BMI_OBESE = 27.5;

export function bmi(weightKg: number, heightCm: number): number {
  const m = heightCm / 100;
  return weightKg / (m * m);
}

export type AsianBmiBand = "under" | "healthy" | "overweight" | "obese";

/** Classify with Asian cut-offs 23 / 27.5 (plus clinical under 18.5). */
export function asianBmiBand(weightKg: number, heightCm: number): AsianBmiBand {
  const v = bmi(weightKg, heightCm);
  if (v < 18.5) return "under";
  if (v >= ASIAN_BMI_OBESE) return "obese";
  if (v >= ASIAN_BMI_OVERWEIGHT) return "overweight";
  return "healthy";
}

/** Waist-to-height ratio (simple screen; not a diagnosis). */
export function waistToHeight(waistCm: number, heightCm: number): number {
  if (heightCm <= 0) return 0;
  return waistCm / heightCm;
}

export function sexBmrConstant(sex: Sex): number {
  return sex === "male" ? 5 : -161;
}
