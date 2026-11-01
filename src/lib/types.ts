// Shared domain types. UI receives numbers as props — components never compute health values.

export type SafetyMode = "normal" | "restricted" | "doctor-first";
export type Goal = "maintain" | "gentle-change" | "build-strength";
export type Lang = "en" | "bn";
export type MealSlot = "breakfast" | "lunch" | "snacks" | "dinner";
export type SourceTag =
  | "measured"
  | "fctb"
  | "borrowed"
  | "user"
  | "estimated"
  | "estimated-recipe"
  | "ai-assisted";

export type Profile = {
  name: string;
  age: number;
  sex: "male" | "female";
  heightCm: number;
  weightKg: number;
  activity: "sedentary" | "light" | "moderate" | "active";
  goal: Goal;
  pace?: "steady" | "gentle";
  safetyMode: SafetyMode;
  eatingStyle: string[];
  budgetBandTaka?: number;
  homeRegion?: string;
  calibratedPlate?: string;
  ricePortionLabel?: string;
};

export type FoodItem = {
  id: string;
  nameBn: string;
  nameEn: string;
  aliases: string[];
  kcalPer100: number;
  proteinPer100: number;
  carbPer100: number;
  fatPer100: number;
  measures: { label: string; grams: number }[];
  sourceTag: SourceTag;
  isCooked: boolean;
  rangeLow?: number;
  rangeHigh?: number;
};

export type LoggedItem = {
  foodId: string;
  nameBn: string;
  nameEn: string;
  quantity: number;
  unit: string;
  grams: number;
  kcalLow: number;
  kcalHigh: number;
  sourceTag: SourceTag;
};

export type MealLog = {
  id: string;
  date: string; // YYYY-MM-DD
  slot: MealSlot;
  items: LoggedItem[];
  method: "text" | "photo" | "preset" | "voice";
  time: string;
};

export type MacroSplit = { protein: number; carb: number; fat: number };

export type DaySummary = {
  date: string;
  kcalLow: number;
  kcalHigh: number;
  targetLow: number;
  targetHigh: number;
  macro: MacroSplit;
  ricePortionLabel?: string;
  waterMl: number;
  steps: number;
  fibreG: number;
  plate: { veg: number; protein: number; grains: number; other: number };
  micros: { iron: string; vitA: string; calcium: string; zinc: string; d: string; b12: string };
};

export type WeekPoint = { date: string; kcal: number; target: number };

export type BudgetState = {
  weekStart: string;
  weeklyBudget: number;
  weeklyUsed: number;
  overshootKcal: number;
  toleranceKcal: number;
  windowDays: number;
  intakeShare: number; // 0.6 default
  activityCapNet: number; // 200
  floorKcal: number; // = BMR
  plan: SpreadDay[];
  safetyMode: SafetyMode;
};

export type SpreadDay = {
  date: string;
  trimKcal: number;
  activityMin: number;
  activityKcal: number;
  floorNote?: string;
};

export type ActivityLog = {
  id: string;
  date: string;
  type: string;
  minutes: number;
  met: number;
  netKcalLow: number;
  netKcalHigh: number;
};

export type Citation = { section: string; page?: number };

export type CoachMessage = {
  id: string;
  role: "user" | "coach";
  text: string;
  citations?: Citation[];
  toolNumbers?: string[];
  refusal?: boolean;
  lowConfidence?: boolean;
  suggestions?: { title: string; body: string; why?: string }[];
  time: string;
};
