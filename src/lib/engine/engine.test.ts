import { describe, expect, test } from "bun:test";
import {
  ACTIVITY_METS,
  adaptiveTdee,
  asianBmiBand,
  bmr,
  feastPreBank,
  gentleDeficitKcal,
  DEFAULT_MINUTES,
  metNetKcal,
  metNetKcalMinutes,
  netKcalRange,
  outdoorAdvice,
  stepsToMinutes,
  proteinBandGPerKg,
  rebalance,
  safetyMode,
  screenFromAnswers,
  tdee,
  waistToHeight,
} from "./index";
import type { RebalanceInput, SafetyScreen } from "./types";

// ─── Gate: hand-check MET ─────────────────────────────────
describe("metNetKcal gate", () => {
  test("70 kg, 40 min brisk walk @ 4.3 MET ≈ 154 kcal net", () => {
    const net = metNetKcal(4.3, 70, 40 / 60);
    expect(Math.round(net)).toBe(154);
  });

  test("metNetKcalMinutes matches hours form", () => {
    expect(metNetKcalMinutes(4.3, 70, 40)).toBeCloseTo(metNetKcal(4.3, 70, 40 / 60), 6);
  });
});

// ─── BMR / TDEE ───────────────────────────────────────────
describe("bmr / tdee", () => {
  test("woman Mifflin-St Jeor", () => {
    // 62 kg, 160 cm, 28 y female
    const v = bmr({ sex: "female", weightKg: 62, heightCm: 160, age: 28 });
    // 10*62 + 6.25*160 - 5*28 - 161 = 620 + 1000 - 140 - 161 = 1319
    expect(v).toBe(1319);
  });

  test("man Mifflin-St Jeor", () => {
    const v = bmr({ sex: "male", weightKg: 70, heightCm: 175, age: 30 });
    // 700 + 1093.75 - 150 + 5 = 1648.75
    expect(v).toBeCloseTo(1648.75, 5);
  });

  test("tdee applies activity factor", () => {
    expect(tdee(1319, "light")).toBeCloseTo(1319 * 1.375, 5);
  });
});

// ─── Asian BMI ────────────────────────────────────────────
describe("asian bmi", () => {
  test("cut-offs 23 / 27.5", () => {
    // 160 cm → 23 BMI = 58.88 kg; 27.5 = 70.4 kg
    expect(asianBmiBand(58, 160)).toBe("healthy");
    expect(asianBmiBand(60, 160)).toBe("overweight");
    expect(asianBmiBand(72, 160)).toBe("obese");
    expect(asianBmiBand(45, 160)).toBe("under");
  });

  test("waist-to-height", () => {
    expect(waistToHeight(80, 160)).toBeCloseTo(0.5, 5);
  });
});

// ─── Safety modes — six test profiles (Wave 1 gate) ───────
describe("safetyMode — six profiles", () => {
  const base = { age: 30, weightKg: 70, heightCm: 165 };

  test("healthy adult → normal", () => {
    const s: SafetyScreen = {
      ...base,
      under18: false,
      pregnancy: false,
      lowBmi: false,
      insulinOrSulfonylurea: false,
      heartOrKidneyDisease: false,
      eatingDisorderHistory: false,
    };
    expect(safetyMode(s)).toBe("normal");
  });

  test("teen under 18 → doctor-first", () => {
    expect(
      safetyMode({
        ...base,
        age: 16,
        under18: true,
        pregnancy: false,
        lowBmi: false,
        insulinOrSulfonylurea: false,
        heartOrKidneyDisease: false,
        eatingDisorderHistory: false,
      }),
    ).toBe("doctor-first");
  });

  test("pregnancy → doctor-first", () => {
    expect(
      safetyMode({
        ...base,
        under18: false,
        pregnancy: true,
        lowBmi: false,
        insulinOrSulfonylurea: false,
        heartOrKidneyDisease: false,
        eatingDisorderHistory: false,
      }),
    ).toBe("doctor-first");
  });

  test("insulin → doctor-first", () => {
    expect(
      safetyMode({
        ...base,
        under18: false,
        pregnancy: false,
        lowBmi: false,
        insulinOrSulfonylurea: true,
        heartOrKidneyDisease: false,
        eatingDisorderHistory: false,
      }),
    ).toBe("doctor-first");
  });

  test("underweight BMI → restricted", () => {
    // 45 kg / 165 cm → BMI ~16.5
    expect(
      safetyMode({
        age: 25,
        weightKg: 45,
        heightCm: 165,
        under18: false,
        pregnancy: false,
        lowBmi: true,
        insulinOrSulfonylurea: false,
        heartOrKidneyDisease: false,
        eatingDisorderHistory: false,
      }),
    ).toBe("restricted");
  });

  test("eating-disorder history → doctor-first", () => {
    expect(
      safetyMode({
        ...base,
        under18: false,
        pregnancy: false,
        lowBmi: false,
        insulinOrSulfonylurea: false,
        heartOrKidneyDisease: false,
        eatingDisorderHistory: true,
      }),
    ).toBe("doctor-first");
  });

  test("screenFromAnswers derives low BMI", () => {
    const screen = screenFromAnswers({
      age: 22,
      weightKg: 44,
      heightCm: 170,
    });
    expect(screen.lowBmi).toBe(true);
    expect(safetyMode(screen)).toBe("restricted");
  });
});

// ─── Rebalance ────────────────────────────────────────────
function dates(n: number): string[] {
  return Array.from({ length: n }, (_, i) => `2026-11-${String(i + 1).padStart(2, "0")}`);
}

describe("rebalance", () => {
  const input = (overrides: Partial<RebalanceInput> = {}): RebalanceInput => ({
    intakeKcal: 2250,
    targetKcal: 1750,
    floorKcal: 1400,
    weightKg: 70,
    dates: dates(4),
    safetyMode: "normal",
    ...overrides,
  });

  test("below tolerance → empty plan", () => {
    const plan = rebalance(input({ intakeKcal: 1800 })); // +50 < 100 tol
    expect(plan.overshootKcal).toBe(0);
    expect(plan.plan).toHaveLength(0);
    expect(plan.blocked).toBe(false);
  });

  test("doctor-first blocks plan", () => {
    const plan = rebalance(input({ safetyMode: "doctor-first" }));
    expect(plan.blocked).toBe(true);
    expect(plan.reason).toBe("doctor-first");
    expect(plan.plan).toHaveLength(0);
  });

  test("restricted blocks plan", () => {
    const plan = rebalance(input({ safetyMode: "restricted" }));
    expect(plan.blocked).toBe(true);
    expect(plan.plan).toHaveLength(0);
  });

  test("covers 50–70% only, never 100%", () => {
    const plan = rebalance(input(), { coverShare: 0.6 });
    const overshoot = 2250 - 1750; // 500
    expect(plan.overshootKcal).toBe(500);
    expect(plan.coverShare).toBeGreaterThanOrEqual(0.5);
    expect(plan.coverShare).toBeLessThanOrEqual(0.7);
    const planned = plan.plan.reduce((s, d) => s + d.trimKcal + d.activityKcal, 0);
    expect(planned).toBeLessThan(overshoot);
    expect(planned).toBeGreaterThan(overshoot * 0.4);
  });

  test("never pushes day below floor", () => {
    // Huge overshoot, low floor room
    const plan = rebalance(
      input({ intakeKcal: 4000, targetKcal: 1500, floorKcal: 1450 }),
      { windowDays: 3, coverShare: 0.7 },
    );
    expect(plan.blocked).toBe(false);
    for (const d of plan.plan) {
      // trim cannot exceed target − floor
      expect(d.trimKcal).toBeLessThanOrEqual(1500 - 1450 + 1); // rounding slack
    }
  });

  test("activity daily net never exceeds cap", () => {
    const plan = rebalance(input({ intakeKcal: 5000 }), {
      activityCapNet: 200,
      intakeShare: 0.2, // most recovery via activity
      windowDays: 4,
    });
    for (const d of plan.plan) {
      expect(d.activityKcal).toBeLessThanOrEqual(200);
    }
  });

  test("window clamped to 3–7", () => {
    expect(rebalance(input({ dates: dates(7) }), { windowDays: 1 }).windowDays).toBe(3);
    expect(rebalance(input({ dates: dates(7) }), { windowDays: 99 }).windowDays).toBe(7);
    // Also clamped by available dates
    expect(rebalance(input({ dates: dates(3) }), { windowDays: 7 }).windowDays).toBe(3);
  });

  test("worked example ≈ 500 overshoot → ~75/day total over 4 days", () => {
    // Research §5.4: 500 over, 60% cover = 300, /4 = 75/day; 60/40 split
    const plan = rebalance(
      input({ intakeKcal: 2250, targetKcal: 1750, weightKg: 70 }),
      { windowDays: 4, intakeShare: 0.6, coverShare: 0.6 },
    );
    expect(plan.overshootKcal).toBe(500);
    expect(plan.coveredKcal).toBe(300);
    const perDay = plan.plan[0].trimKcal + plan.plan[0].activityKcal;
    // ~75 ± rounding
    expect(perDay).toBeGreaterThanOrEqual(65);
    expect(perDay).toBeLessThanOrEqual(85);
    // activity ≈ 30 kcal → ~8 min brisk walk
    expect(plan.plan[0].activityKcal).toBeGreaterThanOrEqual(25);
    expect(plan.plan[0].activityKcal).toBeLessThanOrEqual(35);
    expect(plan.plan[0].activityMin).toBeGreaterThanOrEqual(6);
    expect(plan.plan[0].activityMin).toBeLessThanOrEqual(12);
  });
});

// ─── Adaptive TDEE ────────────────────────────────────────
describe("adaptiveTdee", () => {
  test("thin data → formula, improving at best", () => {
    const r = adaptiveTdee({
      formulaTdee: 2000,
      avgIntakeKcal: 2100,
      weightDeltaKg: 0.1,
      days: 3,
      weighIns: 2,
    });
    expect(r.status).toBe("formula");
    expect(r.estimateKcal).toBeCloseTo(2000, 0);
    expect(r.moreWeighInsNeeded).toBeGreaterThan(0);
    expect(r.noiseNote).toBe(true);
  });

  test("settled window uses adaptive value", () => {
    const r = adaptiveTdee({
      formulaTdee: 2000,
      avgIntakeKcal: 2200,
      weightDeltaKg: 0, // stable weight → TDEE ≈ intake
      days: 14,
      weighIns: 7,
    });
    expect(r.status).toBe("settled");
    expect(r.estimateKcal).toBe(2200);
    expect(r.confidence).toBe(1);
  });

  test("weight gain reduces implied TDEE", () => {
    const r = adaptiveTdee({
      formulaTdee: 2000,
      avgIntakeKcal: 2500,
      weightDeltaKg: 0.7, // gained in 7 days
      days: 7,
      weighIns: 7,
    });
    // 2500 - (0.7*7700/7) = 2500 - 770 = 1730
    expect(r.estimateKcal).toBeLessThan(2500);
    expect(r.estimateKcal).toBeGreaterThan(1700);
  });
});

// ─── Protein band ─────────────────────────────────────────
test("protein band 1.6–2.2 g/kg", () => {
  const b = proteinBandGPerKg(70);
  expect(b.low).toBe(112);
  expect(b.high).toBe(154);
});

// ─── Property tests ───────────────────────────────────────
describe("property: rebalance safety", () => {
  function rand(min: number, max: number) {
    return min + Math.random() * (max - min);
  }

  test("5000 random overshoots: no floor/cap/100% violations", () => {
    const N = 5000;
    for (let i = 0; i < N; i++) {
      const target = rand(1200, 2500);
      const floor = rand(1000, target); // floor ≤ target
      const intake = target + rand(0, 3000);
      const weight = rand(35, 150);
      const windowDays = Math.floor(rand(3, 8));
      const intakeShare = rand(0, 1);
      const activityCap = rand(50, 400);
      const coverShare = rand(0.5, 0.7);
      const mode = "normal" as const;

      const plan = rebalance(
        {
          intakeKcal: intake,
          targetKcal: target,
          floorKcal: floor,
          weightKg: weight,
          dates: dates(windowDays),
          safetyMode: mode,
        },
        { windowDays, intakeShare, activityCapNet: activityCap, coverShare, floorKcal: floor },
      );

      const overshoot = intake - target;
      if (overshoot <= 100) {
        expect(plan.plan.length).toBe(0);
        continue;
      }

      expect(plan.blocked).toBe(false);

      // Never 100% compensation
      const planned = plan.plan.reduce((s, d) => s + d.trimKcal + d.activityKcal, 0);
      expect(planned).toBeLessThan(overshoot);

      // Never exceed 70% cover (rounding slack per day)
      expect(planned).toBeLessThanOrEqual(overshoot * 0.7 + plan.plan.length * 2);

      // Floor and activity-cap always win over coverage targets (safety first).
      // Only assert designed ≥50% cover when the simulation shows clear headroom —
      // the algorithm may move capped activity into trims that then floor-clamp.
      const roomTrimPerDay = Math.max(0, target - floor);
      const intakeShareEff = plan.intakeShare;
      const idealTrim = overshoot * plan.coverShare * intakeShareEff;
      const idealAct = overshoot * plan.coverShare * (1 - intakeShareEff);
      const placeable =
        Math.min(idealTrim, roomTrimPerDay * plan.windowDays) +
        Math.min(idealAct, activityCap * plan.windowDays);
      if (placeable >= overshoot * 0.55) {
        // Sum of rounded integers; allow per-day rounding slack + epsilon.
        const minCover = Math.floor(overshoot * 0.5) - plan.plan.length - 5;
        expect(planned).toBeGreaterThanOrEqual(minCover);
      }

      for (const d of plan.plan) {
        // Floor: trim ≤ target − floor (±1 rounding)
        expect(d.trimKcal).toBeLessThanOrEqual(Math.max(0, target - floor) + 1);
        // Activity cap
        expect(d.activityKcal).toBeLessThanOrEqual(activityCap + 1);
        // Non-negative
        expect(d.trimKcal).toBeGreaterThanOrEqual(0);
        expect(d.activityKcal).toBeGreaterThanOrEqual(0);
        expect(d.activityMin).toBeGreaterThanOrEqual(0);
      }

      // Window bounds
      expect(plan.windowDays).toBeGreaterThanOrEqual(3);
      expect(plan.windowDays).toBeLessThanOrEqual(7);
      expect(plan.plan.length).toBe(plan.windowDays);
    }
  }, 60_000);
});

// ─── Gate: Friday biriyani (Wave 3) ──────────────────────
describe("gate: Friday biriyani", () => {
  test("hand calculation: +800 feast day recovers over 4 days", () => {
    // Target 2000, Friday intake 2800 (biryani + extras) → 800 over.
    // Cover 60% = 480; 60/40 split → 288 trim + 192 activity over 4 days
    // = 72 trim + 48 activity per day. Floor 1500, cap 200 net.
    const plan = rebalance(
      {
        intakeKcal: 2800,
        targetKcal: 2000,
        floorKcal: 1500,
        weightKg: 70,
        dates: dates(4),
        safetyMode: "normal",
      },
      { windowDays: 4, intakeShare: 0.6, coverShare: 0.6, floorKcal: 1500 },
    );
    expect(plan.overshootKcal).toBe(800);
    expect(plan.coveredKcal).toBe(480);
    const planned = plan.plan.reduce((s, d) => s + d.trimKcal + d.activityKcal, 0);
    expect(planned).toBeLessThan(800); // never 100%
    expect(planned).toBeGreaterThanOrEqual(470); // ≈480 ± rounding
    const day = plan.plan[0];
    expect(day.trimKcal).toBeGreaterThanOrEqual(65);
    expect(day.trimKcal).toBeLessThanOrEqual(80); // ≈72
    expect(day.activityKcal).toBeGreaterThanOrEqual(42);
    expect(day.activityKcal).toBeLessThanOrEqual(55); // ≈48
    expect(day.activityKcal).toBeLessThanOrEqual(200); // cap
    expect(2000 - day.trimKcal).toBeGreaterThanOrEqual(1500); // floor
    expect(day.activityMin).toBeGreaterThanOrEqual(10);
    expect(day.activityMin).toBeLessThanOrEqual(15);
  });
});

// ─── Gate: feast pre-bank (Wave 3) ───────────────────────
describe("gate: feast pre-bank", () => {
  test("per-day trim ≤ target − floor so feast week stays above floor", () => {
    // 2400 extra × 0.6 cover / 4 days = 360 ≤ headroom 500
    expect(
      feastPreBank({ feastExtraKcal: 2400, daysBefore: 4, floorKcal: 1500, targetKcal: 2000 }),
    ).toBe(360);
    // Huge feast, tiny headroom → clamped to target − floor
    expect(
      feastPreBank({ feastExtraKcal: 9000, daysBefore: 7, floorKcal: 1900, targetKcal: 2000 }),
    ).toBe(100);
    // Floor = target → no room to pre-bank
    expect(
      feastPreBank({ feastExtraKcal: 1000, daysBefore: 3, floorKcal: 1800, targetKcal: 1800 }),
    ).toBe(0);
  });
});

test("FR-ENG-05: gentle deficit = 0.5 kg/week ≈ 550 kcal/day", () => {
  expect(gentleDeficitKcal()).toBe(550);
  expect(gentleDeficitKcal(1)).toBe(1100);
});

// ─── Gate: MET activity logging (Wave 4, FR-D-01..03) ─────
describe("gate: MET activity", () => {
  test("every preset type has MET > 1 and default minutes", () => {
    for (const type of ["walk", "cycle", "home", "cricket", "yoga", "chores", "steps"]) {
      expect(ACTIVITY_METS[type]).toBeGreaterThan(1);
      if (type !== "steps") expect(DEFAULT_MINUTES[type]).toBeGreaterThan(0);
    }
  });

  test("hand-check: walk 30 min at 70 kg → net 98–133 kcal", () => {
    // net = (4.3 − 1) × 70 × 0.5 = 115.5; band ±15%
    const { low, high } = netKcalRange(4.3, 70, 30);
    expect(low).toBe(98);
    expect(high).toBe(133);
  });

  test("steps convert at ~100 steps/min", () => {
    expect(stepsToMinutes(8000)).toBe(80);
    expect(stepsToMinutes(0)).toBe(1); // never 0 minutes
  });
});

// ─── Gate: indoor switch (Wave 4 AQI/heat half) ───────────
describe("gate: indoor switch", () => {
  test("US AQI ≥151 or feels-like ≥38°C → indoor advice", () => {
    expect(outdoorAdvice(151, 30)).toEqual({ indoor: true, reason: "aqi" });
    expect(outdoorAdvice(100, 38)).toEqual({ indoor: true, reason: "heat" });
    expect(outdoorAdvice(180, 40)).toEqual({ indoor: true, reason: "aqi" });
  });

  test("safe conditions or missing readings → no switch", () => {
    expect(outdoorAdvice(150, 37.9)).toEqual({ indoor: false, reason: null });
    expect(outdoorAdvice(null, null)).toEqual({ indoor: false, reason: null });
    expect(outdoorAdvice(null, 40)).toEqual({ indoor: true, reason: "heat" });
    expect(outdoorAdvice(160, null)).toEqual({ indoor: true, reason: "aqi" });
  });
});
