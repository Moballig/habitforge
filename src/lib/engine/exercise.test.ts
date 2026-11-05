import { describe, expect, test } from "bun:test";
import { exerciseRec, offsetMinutes, type ExerciseInput } from "./exercise";

const base: ExerciseInput = {
  safetyMode: "normal",
  overshootKcal: 0,
  toleranceKcal: 100,
  planActivityMin: 20,
  weightKg: 70,
  hour: 10,
  indoor: false,
};

describe("exerciseRec (FR-D-05 weather gate + calorie-driven)", () => {
  test("doctor-first returns null — no burn framing", () => {
    expect(exerciseRec({ ...base, safetyMode: "doctor-first" })).toBeNull();
  });

  test("outdoor over-shoot → walk primary + cycle alternative, capped minutes", () => {
    const rec = exerciseRec({ ...base, overshootKcal: 400, hour: 15 });
    expect(rec).not.toBeNull();
    expect(rec!.options.map((o) => o.type)).toEqual(["walk", "cycle"]);
    expect(rec!.options[0].minutes).toBeGreaterThanOrEqual(10);
    expect(rec!.options[0].minutes).toBeLessThanOrEqual(45);
    expect(rec!.whyEn).toContain("offset");
  });

  test("indoor (AQI/heat) → only indoor types with indoor flag", () => {
    const rec = exerciseRec({ ...base, indoor: true, overshootKcal: 400 });
    expect(rec!.options.map((o) => o.type)).toEqual(["home", "yoga"]);
    expect(rec!.options.every((o) => o.indoor)).toBe(true);
  });

  test("steady evening gets the gentler yoga alternative", () => {
    const rec = exerciseRec({ ...base, hour: 19 });
    expect(rec!.options.map((o) => o.type)).toEqual(["walk", "yoga"]);
    expect(rec!.whyEn).toContain("steady");
  });

  test("restricted + over → maintenance minutes (plan), no offset why", () => {
    const rec = exerciseRec({ ...base, safetyMode: "restricted", overshootKcal: 400 });
    expect(rec!.options[0].minutes).toBe(20);
    expect(rec!.whyEn).toContain("maintenance");
    expect(rec!.whyEn).not.toContain("offset");
  });

  test("kcal band matches netKcalRange hand-check: 70 kg, 20 min walk → 65–89", () => {
    const rec = exerciseRec({ ...base, planActivityMin: 20, hour: 15 });
    const walk = rec!.options[0];
    expect(walk.type).toBe("walk");
    expect(walk.kcalLow).toBe(65);
    expect(walk.kcalHigh).toBe(89);
  });

  test("offsetMinutes: 400 kcal overshoot at 70 kg clamps to 45", () => {
    expect(offsetMinutes(400, 70)).toBe(45);
    expect(offsetMinutes(50, 70)).toBe(10);
    expect(offsetMinutes(0, 0)).toBe(10); // weight fallback never NaN
  });

  test("label present in both languages for every option", () => {
    const rec = exerciseRec(base);
    for (const o of rec!.options) {
      expect(o.labelEn.length).toBeGreaterThan(0);
      expect(o.labelBn.length).toBeGreaterThan(0);
      expect(o.kcalLow).toBeLessThanOrEqual(o.kcalHigh);
    }
  });
});
