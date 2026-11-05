"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { SourceTag } from "@/lib/types";
import type { RagHit } from "@/lib/ai/rag";

export type { RagHit };

export type ProfileDoc = {
  _id: string;
  key: string;
  name?: string;
  age: number;
  sex: "male" | "female";
  heightCm: number;
  weightKg: number;
  activity: "sedentary" | "light" | "moderate" | "active";
  goal: "maintain" | "gentle-change" | "build-strength";
  pace?: "steady" | "gentle";
  safetyMode: "normal" | "restricted" | "doctor-first";
  safetyScreen?: {
    under18?: boolean;
    pregnancy?: boolean;
    lowBmi?: boolean;
    insulinOrSulfonylurea?: boolean;
    heartOrKidneyDisease?: boolean;
    eatingDisorderHistory?: boolean;
  };
  asianBmi?: number;
  asianBmiBand?: "under" | "healthy" | "overweight" | "obese";
  waistCm?: number;
  waistToHeight?: number;
  eatingStyle: string[];
  budgetBandTaka?: number;
  household?: { eatersFromPot?: number; cooks?: string; mealsOutPerWeek?: number };
  routine?: { commute?: "walk" | "rickshaw" | "bus" | "bike" | "cng"; prayerTimes?: string[] };
  homeRegion?: string;
  calibratedPlate?: string;
  ricePortionLabel?: string;
  womenFriendlyPrivacy?: boolean;
  budgetControls?: { windowDays: number; intakeShare: number };
  familyMembers?: Array<{ id: string; name: string; relation: "child" | "teen" | "adult" | "elder"; condition?: "diabetes" | "hypertension" | "none" }>;
  consent: boolean;
};

export type EnergyDoc = {
  bmr: number;
  tdee: number;
  targetKcal: number;
  floorKcal: number;
  safetyMode: "normal" | "restricted" | "doctor-first";
  bmi?: number;
  bmiBand?: string;
};

export type MealItem = {
  foodId?: string;
  nameBn: string;
  nameEn: string;
  quantity: number;
  unit: string;
  grams: number;
  kcalLow: number;
  kcalHigh: number;
  sourceTag: SourceTag;
};

export type MealLogDoc = {
  _id: string;
  profileKey: string;
  date: string;
  slot: "breakfast" | "lunch" | "snacks" | "dinner";
  items: MealItem[];
  method: "text" | "photo" | "preset" | "voice";
  time?: string;
};

export type DaySummary = {
  date: string;
  mealCount: number;
  itemCount: number;
  totalGrams: number;
  totalKcalLow: number;
  totalKcalHigh: number;
  kcalLow: number;
  kcalHigh: number;
  midpointKcal: number;
  plate: {
    grains: number;
    protein: number;
    veg: number;
    other: number;
  };
  macro: {
    protein: number;
    carb: number;
    fat: number;
  };
  bySlot: {
    breakfast: number;
    lunch: number;
    snacks: number;
    dinner: number;
  };
  meals: MealLogDoc[];
};

export type ActivityEntry = {
  _id: string;
  profileKey: string;
  date: string;
  type: string;
  minutes: number;
  steps?: number;
  netKcalLow: number;
  netKcalHigh: number;
  source: string;
};

export type WeekActivity = {
  dates: string[];
  entries: ActivityEntry[];
  totalMinutes: number;
  totalNetKcalLow: number;
  totalNetKcalHigh: number;
  weekMinutes: number;
  weekNetKcalLow: number;
  weekNetKcalHigh: number;
  daysActive: number;
};

export type BudgetSeries = {
  date: string;
  kcal: number;
  target: number;
};

export type BudgetPlanDay = {
  date: string;
  activityMin: number;
  trimKcal: number;
  activityKcal: number;
  floorClamped?: boolean;
};

export type BudgetDoc = {
  weeklyBudget: number;
  weeklyUsed: number;
  remaining: number;
  dailyTarget: number;
  dailyTargetKcal: number;
  name?: string;
  todayUsed: number;
  todayOver: number;
  overshootKcal: number;
  toleranceKcal: number;
  windowDays: number;
  intakeShare: number;
  floorKcal: number;
  activityCapNet: number;
  blocked: boolean;
  reason?: string;
  dailyTrim: number;
  dailyActivityMin: number;
  dailyActivityKcal: number;
  safetyMode: "normal" | "restricted" | "doctor-first";
  weekStart: string;
  series: BudgetSeries[];
  plan: BudgetPlanDay[];
  rebalancePlan?: any;
};

export type WeighInDoc = {
  _id: string;
  date: string;
  weightKg: number;
  smoothedKg: number;
  note?: string;
};

export type WeightTrend = {
  weighIns: WeighInDoc[];
  adaptive: {
    estimateKcal: number;
    confidence: number;
    status: "formula" | "improving" | "settled";
    moreWeighInsNeeded: number;
    noiseNote: boolean;
  };
  adaptiveTdee?: {
    estimateKcal: number;
    confidence: number;
    status: "formula" | "improving" | "settled";
    moreWeighInsNeeded: number;
    noiseNote: boolean;
  } | null;
  series: Array<{ date: string; rawWeight: number; smoothedWeight: number; note?: string }>;
  currentWeight?: number;
  formulaTdee: number;
  avgIntakeKcal: number;
  days: number;
  weightDeltaKg: number;
};

export type WeatherDoc = {
  _id?: string;
  region: string;
  tempC: number;
  feelsLikeC: number;
  feelsC: number;
  usAqi: number;
  aqi: number;
  indoor: boolean;
  reason?: "aqi" | "heat" | null;
  fetchedAt: number;
};

export type WaterDoc = {
  glasses: number;
  targetGlasses: number;
  ml: number;
  targetMl: number;
  pct: number;
  metGoal: boolean;
};


export type QueryFn<T = any> = (args: any) => Promise<T>;
export type MutationFn<TArgs = any, TRes = any> = (args: TArgs) => Promise<TRes>;
export type ActionFn<TArgs = any, TRes = any> = (args: TArgs) => Promise<TRes>;

export function useQuery<Fn extends (args: any) => Promise<any>>(
  fn: Fn,
  args?: any,
): Awaited<ReturnType<Fn>> | undefined {
  const [data, setData] = useState<Awaited<ReturnType<Fn>> | undefined>(undefined);
  const isSkip = args === "skip" || args === undefined;
  const argsKey = JSON.stringify(args);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const run = useCallback(async () => {
    if (isSkip || typeof fn !== "function") return;
    try {
      const res = await fn(args);
      if (mountedRef.current) {
        setData(res);
      }
    } catch {
      // Fail gracefully
    }
  }, [fn, argsKey, isSkip]);

  useEffect(() => {
    run();
  }, [run]);

  return data;
}

export function useMutation<Fn extends (...args: any[]) => Promise<any>>(fn: Fn): Fn {
  return useCallback(
    async (...args: any[]): Promise<any> => {
      if (typeof fn !== "function") {
        throw new Error("Invalid mutation function");
      }
      return await fn(...args);
    },
    [fn],
  ) as Fn;
}

export function useAction<Fn extends (...args: any[]) => Promise<any>>(fn: Fn): Fn {
  return useCallback(
    async (...args: any[]): Promise<any> => {
      if (typeof fn !== "function") {
        throw new Error("Invalid action function");
      }
      return await fn(...args);
    },
    [fn],
  ) as Fn;
}

async function requestJson(url: string, options?: RequestInit) {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed with ${res.status}`);
  }
  return await res.json();
}

export const api = {
  profile: {
    get: async (args?: { key?: string }): Promise<ProfileDoc | null> => {
      const key = args?.key ?? "default";
      return await requestJson(`/api/profile?key=${encodeURIComponent(key)}`);
    },
    energy: async (args?: { key?: string }): Promise<EnergyDoc | null> => {
      const key = args?.key ?? "default";
      return await requestJson(`/api/profile?key=${encodeURIComponent(key)}&energy=true`);
    },
    save: async (args: any): Promise<string> => {
      return await requestJson("/api/profile", {
        method: "POST",
        body: JSON.stringify(args),
      });
    },
    setBudgetControls: async (args: any): Promise<{ ok: boolean }> => {
      return await requestJson("/api/profile", {
        method: "PATCH",
        body: JSON.stringify({ action: "setBudgetControls", ...args }),
      });
    },
    setWomenFriendlyPrivacy: async (args: any): Promise<{ ok: boolean }> => {
      return await requestJson("/api/profile", {
        method: "PATCH",
        body: JSON.stringify({ action: "setWomenFriendlyPrivacy", ...args }),
      });
    },
    saveFamilyMembers: async (args: any): Promise<{ ok: boolean }> => {
      return await requestJson("/api/profile", {
        method: "PATCH",
        body: JSON.stringify({ action: "saveFamilyMembers", ...args }),
      });
    },
    clearData: async (args?: { key?: string }): Promise<{ ok: boolean }> => {
      return await requestJson("/api/profile", {
        method: "DELETE",
        body: JSON.stringify(args || {}),
      });
    },
  },

  mealLogs: {
    listByDate: async (args: { date: string; key?: string }): Promise<MealLogDoc[]> => {
      const key = args?.key ?? "default";
      return await requestJson(`/api/meals?date=${encodeURIComponent(args.date)}&key=${encodeURIComponent(key)}`);
    },
    listRecent: async (args?: { limit?: number; key?: string }): Promise<MealLogDoc[]> => {
      const key = args?.key ?? "default";
      const limit = args?.limit ?? 10;
      return await requestJson(`/api/meals?recent=true&limit=${limit}&key=${encodeURIComponent(key)}`);
    },
    daySummary: async (args: { date: string; key?: string }): Promise<DaySummary> => {
      const key = args?.key ?? "default";
      return await requestJson(`/api/meals?summary=true&date=${encodeURIComponent(args.date)}&key=${encodeURIComponent(key)}`);
    },
    create: async (args: any): Promise<{ id: string }> => {
      return await requestJson("/api/meals", {
        method: "POST",
        body: JSON.stringify(args),
      });
    },
    update: async (args: any): Promise<{ ok: boolean }> => {
      return await requestJson("/api/meals", {
        method: "PATCH",
        body: JSON.stringify(args),
      });
    },
    remove: async (args: { id: string; key?: string }): Promise<{ ok: boolean }> => {
      const key = args?.key ?? "default";
      return await requestJson(`/api/meals?id=${encodeURIComponent(args.id)}&key=${encodeURIComponent(key)}`, {
        method: "DELETE",
      });
    },
    copyMeal: async (args: any): Promise<string> => {
      return await requestJson("/api/meals", {
        method: "POST",
        body: JSON.stringify({ action: "copy", ...args }),
      });
    },
  },

  activity: {
    listWeek: async (args: { today: string; key?: string }): Promise<WeekActivity> => {
      const key = args?.key ?? "default";
      return await requestJson(`/api/activity?today=${encodeURIComponent(args.today)}&key=${encodeURIComponent(key)}`);
    },
    create: async (args: any): Promise<{ id: string }> => {
      return await requestJson("/api/activity", {
        method: "POST",
        body: JSON.stringify(args),
      });
    },
    remove: async (args: { id: string; key?: string }): Promise<{ ok: boolean }> => {
      const key = args?.key ?? "default";
      return await requestJson(`/api/activity?id=${encodeURIComponent(args.id)}&key=${encodeURIComponent(key)}`, {
        method: "DELETE",
      });
    },
  },

  budget: {
    get: async (args: { today: string; key?: string }): Promise<BudgetDoc> => {
      const key = args?.key ?? "default";
      const res = await requestJson(`/api/budget?today=${encodeURIComponent(args.today)}&key=${encodeURIComponent(key)}`);
      return {
        ...res,
        dailyTarget: res.dailyTarget ?? res.dailyTargetKcal ?? 2000,
        dailyTargetKcal: res.dailyTargetKcal ?? res.dailyTarget ?? 2000,
        overshootKcal: res.overshootKcal ?? res.todayOver ?? 0,
        toleranceKcal: res.toleranceKcal ?? 100,
        windowDays: res.windowDays ?? 4,
        intakeShare: res.intakeShare ?? 0.6,
        floorKcal: res.floorKcal ?? 1400,
        activityCapNet: res.activityCapNet ?? 200,
        blocked: res.blocked ?? false,
        reason: res.reason,
        dailyTrim: res.dailyTrim ?? 0,
        dailyActivityMin: res.dailyActivityMin ?? 0,
        dailyActivityKcal: res.dailyActivityKcal ?? 0,
        weekStart: res.weekStart ?? res.series?.[0]?.date ?? "2026-11-02",
        plan: res.plan ?? res.rebalancePlan?.plan ?? [],
      };
    },
    whatIf: async (args: { today: string; extraKcal: number; key?: string }): Promise<BudgetDoc> => {
      const key = args?.key ?? "default";
      const res = await requestJson(
        `/api/budget?today=${encodeURIComponent(args.today)}&whatIf=${args.extraKcal}&key=${encodeURIComponent(key)}`,
      );
      return {
        ...res,
        dailyTarget: res.dailyTarget ?? res.dailyTargetKcal ?? 2000,
        dailyTargetKcal: res.dailyTargetKcal ?? res.dailyTarget ?? 2000,
        overshootKcal: res.overshootKcal ?? res.todayOver ?? 0,
        toleranceKcal: res.toleranceKcal ?? 100,
        windowDays: res.windowDays ?? 4,
        intakeShare: res.intakeShare ?? 0.6,
        floorKcal: res.floorKcal ?? 1400,
        activityCapNet: res.activityCapNet ?? 200,
        blocked: res.blocked ?? false,
        reason: res.reason,
        dailyTrim: res.dailyTrim ?? 0,
        dailyActivityMin: res.dailyActivityMin ?? 0,
        dailyActivityKcal: res.dailyActivityKcal ?? 0,
        weekStart: res.weekStart ?? res.series?.[0]?.date ?? "2026-11-02",
        plan: res.plan ?? res.rebalancePlan?.plan ?? [],
      };
    },
  },

  weights: {
    trend: async (args: { today: string; key?: string }): Promise<WeightTrend> => {
      const key = args?.key ?? "default";
      const res = await requestJson(`/api/weights?today=${encodeURIComponent(args.today)}&key=${encodeURIComponent(key)}`);
      const weighIns = (res.weighIns || []).map((w: any, idx: number) => ({
        ...w,
        smoothedKg: res.series?.[idx]?.smoothedWeight ?? w.weightKg,
      }));
      const defaultAdaptive = {
        estimateKcal: 2000,
        confidence: 0,
        status: "formula" as const,
        moreWeighInsNeeded: 7,
        noiseNote: false,
      };
      return {
        ...res,
        weighIns,
        adaptive: res.adaptive ?? res.adaptiveTdee ?? defaultAdaptive,
      };
    },
    add: async (args: any): Promise<{ id: string }> => {
      return await requestJson("/api/weights", {
        method: "POST",
        body: JSON.stringify(args),
      });
    },
    remove: async (args: { id: string; key?: string }): Promise<{ ok: boolean }> => {
      const key = args?.key ?? "default";
      return await requestJson(`/api/weights?id=${encodeURIComponent(args.id)}&key=${encodeURIComponent(key)}`, {
        method: "DELETE",
      });
    },
  },

  weather: {
    get: async (args?: { region?: string }): Promise<WeatherDoc> => {
      const region = args?.region ?? "Dhaka";
      return await requestJson(`/api/weather?region=${encodeURIComponent(region)}`);
    },
    refresh: async (args?: { region?: string }): Promise<WeatherDoc> => {
      return await requestJson("/api/weather", {
        method: "POST",
        body: JSON.stringify(args || {}),
      });
    },
  },

  water: {
    get: async (args: { date: string; key?: string }): Promise<WaterDoc> => {
      const key = args?.key ?? "default";
      return await requestJson(`/api/water?date=${encodeURIComponent(args.date)}&key=${encodeURIComponent(key)}`);
    },
    log: async (args: any): Promise<WaterDoc> => {
      return await requestJson("/api/water", {
        method: "POST",
        body: JSON.stringify(args),
      });
    },
  },

  ai: {
    chat: async (args: any): Promise<{ response: string; error?: string }> => {
      const res = await requestJson("/api/coach", {
        method: "POST",
        body: JSON.stringify(args),
      });
      return { response: res.response ?? "", error: res.error };
    },
    parseMeal: async (args: any): Promise<{ picks?: Array<{ id: string; qty: number; unit: string }>; notes?: string; error?: string }> => {
      return await requestJson("/api/ai/parse-meal", {
        method: "POST",
        body: JSON.stringify(args),
      });
    },
    analyzePhoto: async (args: any): Promise<{ items?: Array<{ foodId: string; portionClass: "small" | "medium" | "large"; confidence: number }>; error?: string }> => {
      return await requestJson("/api/ai/analyze-photo", {
        method: "POST",
        body: JSON.stringify(args),
      });
    },
    rewriteQuery: async (args: any): Promise<{ query: string; rewritten?: string }> => {
      return await requestJson("/api/coach", {
        method: "POST",
        body: JSON.stringify({ action: "rewrite", ...args }),
      });
    },
  },

  rag: {
    search: async (args: { query: string; limit?: number; topK?: number; sourceTag?: string; lang?: string; queryEmbedding?: number[] }): Promise<RagHit[]> => {
      return await requestJson("/api/coach", {
        method: "POST",
        body: JSON.stringify({ action: "ragSearch", ...args }),
      });
    },
  },

  foods: {
    search: async (args?: { q?: string; limit?: number }): Promise<any[]> => {
      const q = args?.q ?? "";
      const limit = args?.limit ?? 20;
      return await requestJson(`/api/foods?q=${encodeURIComponent(q)}&limit=${limit}`);
    },
    count: async (): Promise<{ total: number }> => {
      return await requestJson("/api/foods?count=true");
    },
    getById: async (args: { id: string }): Promise<any> => {
      return await requestJson(`/api/foods?id=${encodeURIComponent(args.id)}`);
    },
  },

  privacy: {
    recordConsent: async (): Promise<{ ok: boolean }> => ({ ok: true }),
    deleteMyData: async (args?: { key?: string }): Promise<{ ok: boolean }> => {
      return await requestJson("/api/profile", {
        method: "DELETE",
        body: JSON.stringify(args || {}),
      });
    },
  },
};
