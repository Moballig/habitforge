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
import {
  CONDITION_PLATE_PRESETS,
  getPlatePresetForProfile,
  evaluatePlateBalance,
} from "./conditionPlates";

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

  describe("Condition-Aware Deshi Plate Presets (FR-G-01 & FR-G-02)", () => {
    test("every plate preset has valid ratios summing to 1.0", () => {
      const presets = Object.values(CONDITION_PLATE_PRESETS);
      expect(presets.length).toBe(3);
      for (const p of presets) {
        const sum = p.ratios.veg + p.ratios.protein + p.ratios.grains + p.ratios.other;
        expect(Math.abs(sum - 1.0)).toBeLessThan(0.001);
        expect(p.ratios.veg).toBe(0.5);
        expect(p.ratios.protein).toBe(0.25);
        expect(p.ratios.grains).toBe(0.25);
      }
    });

    test("clinical disclaimers cite national guidelines and mandate physician coordination", () => {
      const dm = CONDITION_PLATE_PRESETS.diabetes;
      const ht = CONDITION_PLATE_PRESETS.hypertension;

      expect(dm.clinicalDisclaimer).toContain("National Dietary Guidelines for Bangladesh 2025");
      expect(dm.clinicalDisclaimer).toContain("BIRDEM");
      expect(dm.clinicalDisclaimer).toContain("Consult your doctor");

      expect(ht.clinicalDisclaimer).toContain("WHO Bangladesh sodium guidelines");
      expect(ht.clinicalDisclaimer).toContain("National Heart Foundation");
      expect(ht.clinicalDisclaimer).toContain("cardiologist");
    });

    test("profile routing detects diabetes and hypertension conditions", () => {
      const dmProfile = getPlatePresetForProfile({
        eatingStyle: ["diabetes-conscious"],
        safetyScreen: { insulinOrSulfonylurea: true },
      });
      expect(dmProfile.id).toBe("diabetes");

      const htProfile = getPlatePresetForProfile({
        eatingStyle: ["low-sodium"],
        safetyScreen: { heartOrKidneyDisease: true },
      });
      expect(htProfile.id).toBe("hypertension");

      const defaultProfile = getPlatePresetForProfile({
        eatingStyle: ["rice-heavy"],
      });
      expect(defaultProfile.id).toBe("general");
    });

    test("plate balance evaluator detects heavy rice dominance", () => {
      const heavyRice = { veg: 0.1, protein: 0.1, grains: 0.8, other: 0.0 };
      const res = evaluatePlateBalance(heavyRice, CONDITION_PLATE_PRESETS.general);
      expect(res.isWellBalanced).toBe(false);
      expect(res.adviceEn).toContain("Rice/grain portion is currently dominating");
      expect(res.diffGrains).toBeGreaterThan(0.4);
    });

    test("plate balance evaluator passes well-balanced meals", () => {
      const balanced = { veg: 0.48, protein: 0.26, grains: 0.26, other: 0.0 };
      const res = evaluatePlateBalance(balanced, CONDITION_PLATE_PRESETS.general);
      expect(res.isWellBalanced).toBe(true);
      expect(res.adviceEn).toContain("close to the recommended balance");
    });
  });
});

