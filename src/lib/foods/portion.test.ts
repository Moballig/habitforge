import { expect, test } from "bun:test";
import { searchFoods, toLoggedItemFromGrams } from "./search";
import { sharedPotGrams } from "./portion";

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
