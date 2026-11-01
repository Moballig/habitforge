import { describe, expect, test } from "bun:test";
import { FOOD_SEED } from "./seed";
import { searchFoods, toLoggedItem } from "./search";

describe("food seed", () => {
  test("contains 300+ unique, usable rows", () => {
    expect(FOOD_SEED.length).toBeGreaterThanOrEqual(300);
    expect(new Set(FOOD_SEED.map((food) => food.nameEn)).size).toBe(FOOD_SEED.length);
    expect(new Set(FOOD_SEED.map((food) => food.nameBn)).size).toBe(FOOD_SEED.length);

    for (const food of FOOD_SEED) {
      expect(food.nameBn.length).toBeGreaterThan(0);
      expect(food.nameEn.length).toBeGreaterThan(0);
      expect(food.measures.length).toBeGreaterThan(0);
      expect(food.kcalPer100).toBeGreaterThanOrEqual(0);
      expect(food.proteinPer100).toBeGreaterThanOrEqual(0);
      expect(food.carbPer100).toBeGreaterThanOrEqual(0);
      expect(food.fatPer100).toBeGreaterThanOrEqual(0);
      if (food.rangeLow !== undefined && food.rangeHigh !== undefined) {
        expect(food.rangeLow).toBeLessThanOrEqual(food.rangeHigh);
      }
    }
  });
});

describe("offline food search", () => {
  test("matches English, Bangla, and Banglish aliases", () => {
    expect(searchFoods("panta").some((food) => food.nameEn === "Panta bhat")).toBe(true);
    expect(searchFoods("পান্তা").some((food) => food.nameEn === "Panta bhat")).toBe(true);
    expect(searchFoods("khashi").some((food) => food.nameEn.includes("Mutton"))).toBe(true);
  });

  test("computes portion ranges in code", () => {
    const panta = searchFoods("panta").find((food) => food.nameEn === "Panta bhat");
    expect(panta).toBeDefined();
    const item = toLoggedItem(panta!, 1, "bati small");
    expect(item.grams).toBe(150);
    expect(item.kcalLow).toBe(96);
    expect(item.kcalHigh).toBe(129);
  });
});
