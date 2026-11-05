import { describe, expect, test } from "bun:test";
import { calculateWaterProgress, GLASS_ML } from "./water";

describe("water tracking progress", () => {
  test("calculates millilitres and percentages accurately", () => {
    const res = calculateWaterProgress(4, 8);
    expect(res.glasses).toBe(4);
    expect(res.ml).toBe(1000);
    expect(res.pct).toBe(50);
    expect(res.metGoal).toBe(false);
  });

  test("clamps negative glasses to 0", () => {
    const res = calculateWaterProgress(-2, 8);
    expect(res.glasses).toBe(0);
    expect(res.ml).toBe(0);
    expect(res.pct).toBe(0);
  });

  test("detects goal completion and caps percentage at 100", () => {
    const res = calculateWaterProgress(10, 8);
    expect(res.glasses).toBe(10);
    expect(res.ml).toBe(2500);
    expect(res.pct).toBe(100);
    expect(res.metGoal).toBe(true);
  });
});

