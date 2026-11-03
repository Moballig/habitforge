import { describe, expect, test } from "bun:test";
import {
  getCheapestProteinSources,
  calculateProteinDailyCost,
  DESHI_PROTEIN_BENCHMARKS,
} from "./proteinCost";
import {
  generateFastingPlan,
  clampRamadanBudget,
} from "./ramadan";

describe("Wave 6 Personalisation Engine", () => {
  describe("Cheap Protein & Taka Economics (FR-G-05)", () => {
    test("every protein benchmark item has valid positive nutrition and price", () => {
      for (const item of DESHI_PROTEIN_BENCHMARKS) {
        expect(item.proteinPer100g).toBeGreaterThan(0);
        expect(item.kcalPer100g).toBeGreaterThan(0);
        expect(item.pricePerKgBDT).toBeGreaterThan(0);
        expect(item.proteinPer100BDT).toBeGreaterThan(0);
        expect(item.costPer20gProteinBDT).toBeGreaterThan(0);
      }
    });

    test("sorting returns highest protein per 100 Taka first", () => {
      const sorted = getCheapestProteinSources();
      expect(sorted.length).toBe(DESHI_PROTEIN_BENCHMARKS.length);
      for (let i = 0; i < sorted.length - 1; i++) {
        expect(sorted[i].proteinPer100BDT).toBeGreaterThanOrEqual(
          sorted[i + 1].proteinPer100BDT,
        );
      }
      // Legumes/Soybeans/Dals or eggs should rank at the top
      expect(["staple_dal", "soy_seeds"]).toContain(sorted[0].category);
    });

    test("category filter correctly scopes items", () => {
      const fishOnly = getCheapestProteinSources("fish");
      expect(fishOnly.length).toBeGreaterThan(0);
      for (const f of fishOnly) {
        expect(f.category).toBe("fish");
      }
    });

    test("daily protein cost estimates scale with grams", () => {
      const cost50g = calculateProteinDailyCost(50);
      const cost100g = calculateProteinDailyCost(100);

      expect(cost50g.lowCostBDT).toBeLessThan(cost50g.balancedCostBDT);
      expect(cost50g.balancedCostBDT).toBeLessThan(cost50g.premiumCostBDT);
      expect(cost100g.lowCostBDT).toBeGreaterThan(cost50g.lowCostBDT);
    });
  });

  describe("Ramadan & Fasting Mode Guardrails (FR-G-03)", () => {
    test("ramadan mode strictly blocks calorie deficit by default", () => {
      const tdee = 2100;
      const res = clampRamadanBudget(tdee, true, false);
      expect(res.targetKcal).toBe(2100);
      expect(res.isDeficitBlocked).toBe(true);
      expect(res.note).toContain("Ramadan Safe Guardrail");
    });

    test("user can optionally opt in to deficit if medically cleared", () => {
      const tdee = 2100;
      const res = clampRamadanBudget(tdee, true, true);
      expect(res.isDeficitBlocked).toBe(false);
    });

    test("fasting plan generates full hydration pacing and meal shares summing ~100%", () => {
      const plan = generateFastingPlan(2000);
      expect(plan.hydrationSlots.length).toBe(4);
      expect(plan.hydrationTargetGlasses).toBeGreaterThanOrEqual(8);

      const totalShares = plan.mealPacing.reduce(
        (sum, m) => sum + m.calorieSharePercent,
        0,
      );
      expect(totalShares).toBe(100);
      expect(plan.mealPacing[0].slot).toBe("iftar");
      expect(plan.mealPacing[2].slot).toBe("sehri");
    });
  });
});
