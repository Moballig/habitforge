import { describe, expect, test } from "bun:test";
import { nextMove, type NextMoveInput } from "./nextMove";

const base: NextMoveInput = {
  safetyMode: "normal",
  targetKcal: 1800,
  eatenLow: 900,
  eatenHigh: 1000,
  overshootKcal: 0,
  toleranceKcal: 100,
  bySlot: { breakfast: 0, lunch: 0, snacks: 0, dinner: 0 },
  plate: { veg: 0, protein: 0, grains: 0, other: 0 },
  planActivityMin: 20,
  weightKg: 70,
  hour: 9,
  indoor: false,
};

const allLogged = { breakfast: 500, lunch: 600, snacks: 50, dinner: 550 };

describe("nextMove (FR-H-01 calorie-driven recommendation)", () => {
  test("morning with room to eat → eat + food + log cta", () => {
    const m = nextMove(base);
    expect(m.kind).toBe("eat");
    expect(m.food).toBeDefined();
    expect(m.exercise).toBeDefined();
    expect(m.food!.kcalLow).toBeLessThan(m.food!.kcalHigh);
    expect(m.cta).toBe("log");
    expect(m.detailEn).toContain("kcal");
    expect(m.headlineBn).toContain("ক্যালোরি");
  });

  test("over tolerance → move with offset exercise capped 10–45 min", () => {
    const m = nextMove({
      ...base,
      hour: 15,
      eatenLow: 2100,
      eatenHigh: 2200,
      overshootKcal: 400,
      bySlot: allLogged,
    });
    expect(m.kind).toBe("move");
    expect(m.exercise).toBeDefined();
    expect(m.exercise![0].type).toBe("walk");
    expect(m.exercise![0].minutes).toBeGreaterThanOrEqual(10);
    expect(m.exercise![0].minutes).toBeLessThanOrEqual(45);
    expect(m.exercise![0].kcalLow).toBeGreaterThan(0);
    expect(m.exercise![0].kcalHigh).toBeGreaterThanOrEqual(m.exercise![0].kcalLow);
    expect(m.cta).toBe("activity");
  });

  test("tiny overshoot within tolerance is not a move", () => {
    const m = nextMove({
      ...base,
      hour: 15,
      eatenLow: 1850,
      eatenHigh: 1900,
      overshootKcal: 80,
      bySlot: allLogged,
    });
    expect(m.kind).not.toBe("move");
  });

  test("restricted + over → never move (no offset pressure)", () => {
    const m = nextMove({
      ...base,
      safetyMode: "restricted",
      hour: 15,
      eatenLow: 2100,
      eatenHigh: 2200,
      overshootKcal: 400,
      bySlot: allLogged,
    });
    expect(m.kind).not.toBe("move");
    expect(m.cta).toBe("plan");
    // maintenance mode keeps plan minutes, never the offset burn
    expect(m.exercise).toBeDefined();
    expect(m.exercise![0].minutes).toBe(20);
  });

  test("late evening with a gap → rest, no eat pressure", () => {
    const m = nextMove({ ...base, hour: 22 });
    expect(m.kind).toBe("rest");
    expect(m.food).toBeUndefined();
    expect(m.cta).toBeNull();
  });

  test("doctor-first → rest with no numbers, food or exercise", () => {
    const m = nextMove({ ...base, safetyMode: "doctor-first", hour: 10 });
    expect(m.kind).toBe("rest");
    expect(m.food).toBeUndefined();
    expect(m.exercise).toBeUndefined();
    expect(`${m.headlineEn}${m.detailEn}`).not.toMatch(/\d/);
  });

  test("steady day keeps the plan's activity minutes + indoor flag", () => {
    const m = nextMove({
      ...base,
      hour: 15,
      eatenLow: 1700,
      eatenHigh: 1750,
      bySlot: allLogged,
      indoor: true,
    });
    expect(m.kind).toBe("steady");
    expect(m.exercise).toBeDefined();
    expect(m.exercise![0].type).toBe("home");
    expect(m.exercise![0].minutes).toBe(20);
    expect(m.exercise![0].indoor).toBe(true);
    expect(m.cta).toBe("activity");
  });

  test("plate protein gap picks a protein-forward food", () => {
    const m = nextMove({
      ...base,
      hour: 12,
      plate: { veg: 400, protein: 50, grains: 300, other: 0 },
    });
    expect(m.kind).toBe("eat");
    expect(m.food!.nameEn.toLowerCase()).toMatch(/fish|egg|dal/);
  });

  test("zero weight falls back to a safe default, never NaN", () => {
    const m = nextMove({ ...base, weightKg: 0, hour: 15, bySlot: allLogged, eatenLow: 1700, eatenHigh: 1750 });
    expect(Number.isFinite(m.exercise![0].kcalLow)).toBe(true);
    expect(m.exercise![0].kcalLow).toBeGreaterThan(0);
  });
});
