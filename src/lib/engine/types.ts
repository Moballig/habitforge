// Pure deterministic engine — shared by client and Convex. No LLM, no I/O.
// Sources: research §5 (BMR/TDEE/MET/rebalance/safety/adaptive).

export type Sex = "male" | "female";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active";
export type Goal = "maintain" | "gentle-change" | "build-strength";
export type SafetyMode = "normal" | "restricted" | "doctor-first";

export type EngineProfile = {
  age: number;
  sex: Sex;
  heightCm: number;
  weightKg: number;
  activity: ActivityLevel;
  goal: Goal;
};

export type SafetyScreen = {
  age: number;
  weightKg: number;
  heightCm: number;
  under18: boolean;
  pregnancy: boolean;
  lowBmi: boolean;
  insulinOrSulfonylurea: boolean;
  heartOrKidneyDisease: boolean;
  eatingDisorderHistory: boolean;
};

export type RebalanceControls = {
  /** Recovery window 3–7 days (default 4). */
  windowDays?: number;
  /** Share of recovery from intake trims 0–1 (default 0.6). */
  intakeShare?: number;
  /** Max net kcal from extra activity per day (default 200). */
  activityCapNet?: number;
  /** Never push a day below this (default = BMR). */
  floorKcal?: number;
  /** Overshoot tolerance in kcal (default 100). */
  toleranceKcal?: number;
  /** Fraction of overshoot to cover 0.5–0.7 (default 0.6). Never 1.0. */
  coverShare?: number;
};

export type RebalanceInput = {
  /** Today's logged intake (kcal). */
  intakeKcal: number;
  /** Today's target (kcal). */
  targetKcal: number;
  /** Personal floor (BMR). */
  floorKcal: number;
  /** Body weight used for MET activity minutes. */
  weightKg: number;
  /** Preferred MET for extra walking (default 4.3). */
  preferredMet?: number;
  /** ISO dates for plan days (length >= windowDays). */
  dates: string[];
  safetyMode: SafetyMode;
};

export type SpreadDay = {
  date: string;
  trimKcal: number;
  activityKcal: number;
  activityMin: number;
  /** True if trim would have gone below floor before clamping. */
  floorClamped: boolean;
};

export type RebalancePlan = {
  safetyMode: SafetyMode;
  /** Amount over target after tolerance (0 if none / blocked). */
  overshootKcal: number;
  /** Fraction of overshoot actually planned (never 1.0). */
  coverShare: number;
  coveredKcal: number;
  windowDays: number;
  intakeShare: number;
  activityCapNet: number;
  floorKcal: number;
  dailyTrimTotal: number;
  dailyActivityTotal: number;
  plan: SpreadDay[];
  /** True when safety mode blocks deficit + exercise compensation. */
  blocked: boolean;
  reason?: "doctor-first" | "restricted";
};

export type AdaptiveTdeeInput = {
  /** Formula estimate to blend toward when data is thin. */
  formulaTdee: number;
  /** Average logged intake over the window. */
  avgIntakeKcal: number;
  /** Weight change over window in kg (positive = gained). */
  weightDeltaKg: number;
  /** Number of days in the window. */
  days: number;
  /** Number of weigh-ins recorded. */
  weighIns: number;
};

export type AdaptiveTdeeResult = {
  estimateKcal: number;
  /** 0–1 confidence; low until ~14 days / 2–3 weeks of data. */
  confidence: number;
  status: "formula" | "improving" | "settled";
  /** Extra weigh-ins recommended before trusting the blend. */
  moreWeighInsNeeded: number;
  noiseNote: boolean;
};
