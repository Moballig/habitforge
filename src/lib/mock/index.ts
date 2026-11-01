import type {
  ActivityLog,
  BudgetState,
  CoachMessage,
  DaySummary,
  FoodItem,
  MealLog,
  Profile,
  WeekPoint,
} from "../types";

// Demo data only — clearly labelled; not real user data.
export const DEMO_PROFILE: Profile = {
  name: "Mira",
  age: 28,
  sex: "female",
  heightCm: 160,
  weightKg: 62,
  activity: "light",
  goal: "gentle-change",
  pace: "gentle",
  safetyMode: "normal",
  eatingStyle: ["rice-heavy"],
  budgetBandTaka: 250,
  homeRegion: "Dhaka",
  calibratedPlate: "medium",
  ricePortionLabel: "about 1 bati",
};

export const DOCTOR_FIRST_PROFILE: Profile = {
  ...DEMO_PROFILE,
  name: "Karim",
  age: 16,
  safetyMode: "doctor-first",
};

export const RESTRICTED_PROFILE: Profile = {
  ...DEMO_PROFILE,
  name: "Ashra",
  safetyMode: "restricted",
};

export const FOODS: FoodItem[] = [
  {
    id: "bhat",
    nameBn: "ভাত",
    nameEn: "Steamed rice",
    aliases: ["bhat", "chal", "rice"],
    kcalPer100: 130,
    proteinPer100: 2.7,
    carbPer100: 28,
    fatPer100: 0.3,
    measures: [
      { label: "bati small", grams: 150 },
      { label: "bati medium", grams: 200 },
      { label: "bati large", grams: 300 },
      { label: "plate half", grams: 150 },
    ],
    sourceTag: "estimated-recipe",
    isCooked: true,
    rangeLow: 115,
    rangeHigh: 145,
  },
  {
    id: "dal",
    nameBn: "ডাল",
    nameEn: "Lentil curry",
    aliases: ["dal", "dhal", "lentil"],
    kcalPer100: 115,
    proteinPer100: 6,
    carbPer100: 16,
    fatPer100: 3,
    measures: [
      { label: "bowl", grams: 150 },
      { label: "serving spoon", grams: 50 },
    ],
    sourceTag: "estimated-recipe",
    isCooked: true,
    rangeLow: 95,
    rangeHigh: 140,
  },
  {
    id: "alu-bhorta",
    nameBn: "আলু ভর্তা",
    nameEn: "Mashed potato",
    aliases: ["alu bhorta", "aloo vorta", "ভর্তা"],
    kcalPer100: 145,
    proteinPer100: 2,
    carbPer100: 18,
    fatPer100: 7,
    measures: [{ label: "portion", grams: 80 }],
    sourceTag: "estimated-recipe",
    isCooked: true,
    rangeLow: 120,
    rangeHigh: 170,
  },
  {
    id: "mach",
    nameBn: "মাছ",
    nameEn: "Fish curry",
    aliases: ["mach", "maas", "fish", "ilish", "shorshe ilish"],
    kcalPer100: 165,
    proteinPer100: 18,
    carbPer100: 2,
    fatPer100: 9,
    measures: [
      { label: "piece", grams: 100 },
      { label: "piece large", grams: 150 },
    ],
    sourceTag: "estimated-recipe",
    isCooked: true,
    rangeLow: 140,
    rangeHigh: 200,
  },
  {
    id: "dim",
    nameBn: "ডিম",
    nameEn: "Egg",
    aliases: ["dim", "egg", "ande"],
    kcalPer100: 155,
    proteinPer100: 13,
    carbPer100: 1,
    fatPer100: 11,
    measures: [{ label: "piece", grams: 50 }],
    sourceTag: "fctb",
    isCooked: true,
  },
  {
    id: "ruti",
    nameBn: "রুটি",
    nameEn: "Flatbread",
    aliases: ["ruti", "roti", "chapati"],
    kcalPer100: 264,
    proteinPer100: 8,
    carbPer100: 55,
    fatPer100: 2,
    measures: [{ label: "piece", grams: 40 }],
    sourceTag: "estimated-recipe",
    isCooked: true,
  },
  {
    id: "cha",
    nameBn: "চা",
    nameEn: "Milk tea",
    aliases: ["cha", "tea", "cha pani"],
    kcalPer100: 60,
    proteinPer100: 2,
    carbPer100: 8,
    fatPer100: 2,
    measures: [{ label: "cup", grams: 150 }],
    sourceTag: "estimated",
    isCooked: true,
  },
  {
    id: "biriyani",
    nameBn: "বিরিয়ানি",
    nameEn: "Biriyani",
    aliases: ["biriyani", "biryani", "কাচ্চি"],
    kcalPer100: 190,
    proteinPer100: 8,
    carbPer100: 26,
    fatPer100: 6,
    measures: [{ label: "plate", grams: 350 }],
    sourceTag: "estimated",
    isCooked: true,
    rangeLow: 160,
    rangeHigh: 230,
  },
];

export const TODAY_MEALS: MealLog[] = [
  {
    id: "m1",
    date: todayISO(),
    slot: "breakfast",
    method: "text",
    time: "08:10",
    items: [
      { foodId: "ruti", nameBn: "রুটি", nameEn: "Flatbread", quantity: 2, unit: "piece", grams: 80, kcalLow: 200, kcalHigh: 220, sourceTag: "estimated-recipe" },
      { foodId: "dim", nameBn: "ডিম", nameEn: "Egg", quantity: 1, unit: "piece", grams: 50, kcalLow: 70, kcalHigh: 85, sourceTag: "fctb" },
      { foodId: "cha", nameBn: "চা", nameEn: "Milk tea", quantity: 1, unit: "cup", grams: 150, kcalLow: 55, kcalHigh: 70, sourceTag: "estimated" },
    ],
  },
  {
    id: "m2",
    date: todayISO(),
    slot: "lunch",
    method: "text",
    time: "13:05",
    items: [
      { foodId: "bhat", nameBn: "ভাত", nameEn: "Steamed rice", quantity: 1, unit: "bati medium", grams: 200, kcalLow: 240, kcalHigh: 290, sourceTag: "estimated-recipe" },
      { foodId: "dal", nameBn: "ডাল", nameEn: "Lentil curry", quantity: 1, unit: "bowl", grams: 150, kcalLow: 140, kcalHigh: 210, sourceTag: "estimated-recipe" },
      { foodId: "alu-bhorta", nameBn: "আলু ভর্তা", nameEn: "Mashed potato", quantity: 1, unit: "portion", grams: 80, kcalLow: 95, kcalHigh: 140, sourceTag: "estimated-recipe" },
      { foodId: "mach", nameBn: "মাছ", nameEn: "Fish curry", quantity: 1, unit: "piece", grams: 100, kcalLow: 140, kcalHigh: 200, sourceTag: "estimated-recipe" },
    ],
  },
];

export const WEEK: WeekPoint[] = last7Days([
  1650, 1720, 1580, 1890, 1740, 2100, 1980,
]);

export const TODAY_SUMMARY: DaySummary = {
  date: todayISO(),
  kcalLow: 1750,
  kcalHigh: 2050,
  targetLow: 1650,
  targetHigh: 1850,
  macro: { protein: 68, carb: 240, fat: 62 },
  ricePortionLabel: "about 1.5 bati",
  waterMl: 1200,
  steps: 4200,
  fibreG: 18,
  plate: { veg: 0.2, protein: 0.15, grains: 0.5, other: 0.15 },
  micros: {
    iron: "low–mid",
    vitA: "ok",
    calcium: "low",
    zinc: "ok",
    d: "low",
    b12: "ok",
  },
};

export const OVERSHOOT_BUDGET: BudgetState = {
  weekStart: weekStartISO(),
  weeklyBudget: 11900,
  weeklyUsed: 12850,
  overshootKcal: 500,
  toleranceKcal: 100,
  windowDays: 4,
  intakeShare: 0.6,
  activityCapNet: 200,
  floorKcal: 1350,
  safetyMode: "normal",
  plan: [
    { date: offsetISO(1), trimKcal: 45, activityMin: 8, activityKcal: 30 },
    { date: offsetISO(2), trimKcal: 45, activityMin: 8, activityKcal: 30 },
    { date: offsetISO(3), trimKcal: 45, activityMin: 8, activityKcal: 30 },
    { date: offsetISO(4), trimKcal: 45, activityMin: 8, activityKcal: 30 },
  ],
};

export const ACTIVITIES: ActivityLog[] = [
  { id: "a1", date: todayISO(), type: "walk", minutes: 30, met: 4.3, netKcalLow: 110, netKcalHigh: 145 },
  { id: "a2", date: offsetISO(-1), type: "yoga", minutes: 20, met: 2.5, netKcalLow: 35, netKcalHigh: 50 },
];

export const COACH_SEED: CoachMessage[] = [
  {
    id: "c1",
    role: "user",
    text: "diabetes thakle bhat koto khabo?",
    time: "10:02",
  },
  {
    id: "c2",
    role: "coach",
    text: "প্লেটের এক-চতুর্থাংশ ভাত, বাকি অংশে সবজি ও প্রোটিন রাখলে ভালো। ছোট বাটি বেছে নিন এবং ভাতের পর একটু হাঁটলে সাহায্য হয়। ডায়াবেটিস থাকলে চিকিৎসকের পরামর্শ নিন।",
    citations: [{ section: "Disease guidance — Diabetes", page: 84 }],
    toolNumbers: ["plate ¼ rice"],
    time: "10:02",
  },
];

export function todayISO(): string {
  return toISO(new Date());
}

export function offsetISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toISO(d);
}

export function weekStartISO(): string {
  const d = new Date();
  const day = d.getDay();
  d.setDate(d.getDate() - ((day + 6) % 7));
  return toISO(d);
}

function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function last7Days(kcals: number[]): WeekPoint[] {
  const target = 1750;
  return kcals.map((kcal, i) => ({
    date: offsetISO(i - 6),
    kcal,
    target,
  }));
}
