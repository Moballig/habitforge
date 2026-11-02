import { expect, test } from "bun:test";
import { searchFoods, toLoggedItemFromGrams } from "./search";
import { portionClassToGrams, sharedPotGrams } from "./portion";

test("shared-pot dal converts 1/5 of 1000 g to a sensible portion", () => {
  const grams = sharedPotGrams(1000, 1, 5);
  expect(grams).toBe(200);
  const dal = searchFoods("dal").find((food) => food.nameEn === "Cooked dal");
  expect(dal).toBeDefined();
  const item = toLoggedItemFromGrams(dal!, grams, "1/5 pot");
  expect(item.grams).toBe(200);
  expect(item.kcalLow).toBe(196);
  expect(item.kcalHigh).toBe(264);
});

test("shared-pot math rejects impossible fractions", () => {
  expect(() => sharedPotGrams(1000, 6, 5)).toThrow(RangeError);
  expect(() => sharedPotGrams(0, 1, 5)).toThrow(RangeError);
});

test("portion class maps onto an ascending measure ladder", () => {
  const rice = searchFoods("rice").find((f) => f.measures.some((m) => m.label === "bati small"));
  expect(rice).toBeDefined();
  expect(portionClassToGrams(rice!, "small")).toEqual({ grams: 150, label: "bati small" });
  expect(portionClassToGrams(rice!, "medium").grams).toBe(200);
  expect(portionClassToGrams(rice!, "large").grams).toBe(300);
});

test("portion class sorts unsorted measure ladders", () => {
  const food = {
    measures: [
      { label: "bowl", grams: 150 },
      { label: "serving spoon", grams: 50 },
    ],
    isCooked: true,
  };
  expect(portionClassToGrams(food, "small")).toEqual({ grams: 50, label: "serving spoon" });
  expect(portionClassToGrams(food, "large")).toEqual({ grams: 150, label: "bowl" });
  // even ladder: medium = average of the two middle measures
  expect(portionClassToGrams(food, "medium").grams).toBe(100);
});

test("portion class falls back to cooked/raw defaults without measures", () => {
  const cooked = { measures: [], isCooked: true };
  const raw = { measures: [], isCooked: false };
  expect(portionClassToGrams(cooked, "small").grams).toBe(75);
  expect(portionClassToGrams(cooked, "medium").grams).toBe(150);
  expect(portionClassToGrams(cooked, "large").grams).toBe(250);
  expect(portionClassToGrams(raw, "large").grams).toBe(150);
});
