import { describe, expect, test } from "bun:test";
import { CONDITION_PLATE_PRESETS } from "./conditionPlates";
import {
  buildFamilyMenu,
  FAMILY_MENU,
  portionsForKcal,
  RELATION_FACTOR,
  type FamilyMember,
} from "./family";

const BASE = 1800;

const MEMBERS: FamilyMember[] = [
  { id: "m1", name: "Rahim", relation: "adult" },
  { id: "m2", name: "Karim", relation: "child" },
  { id: "m3", name: "Ayesha", relation: "elder", condition: "diabetes" },
];

describe("family mode (FR-G-06)", () => {
  test("gate: one shared menu regardless of members", () => {
    const a = buildFamilyMenu(BASE, MEMBERS);
    const b = buildFamilyMenu(BASE, []);
    expect(a.menu).toBe(FAMILY_MENU);
    expect(b.menu).toBe(FAMILY_MENU);
    expect(a.menu).toHaveLength(3);
    const shares = a.menu.reduce((s, d) => s + d.share, 0);
    expect(shares).toBeCloseTo(1, 5);
  });

  test("gate: per-person portions differ by relation", () => {
    const { portions } = buildFamilyMenu(BASE, MEMBERS);
    expect(portions).toHaveLength(MEMBERS.length);
    const [adult, child, elder] = portions;
    expect(adult.kcal).toBe(Math.round(BASE * RELATION_FACTOR.adult));
    expect(child.kcal).toBe(Math.round(BASE * RELATION_FACTOR.child));
    expect(elder.kcal).toBe(Math.round(BASE * RELATION_FACTOR.elder));
    expect(child.kcal).toBeLessThan(adult.kcal);
    expect(elder.kcal).toBeLessThan(adult.kcal);
    for (const p of portions) {
      expect(p.kcal).toBeGreaterThan(0);
      expect(p.riceBati).toBeGreaterThan(0);
      expect(p.proteinServings).toBeGreaterThan(0);
    }
  });

  test("gate: condition members carry a doctor note, healthy members do not", () => {
    const { portions } = buildFamilyMenu(BASE, MEMBERS);
    expect(portions[2].doctorNote).toContain("doctor");
    expect(portions[0].doctorNote).toBeUndefined();
    expect(portions[1].doctorNote).toBeUndefined();
  });

  test("hypertension member gets the hypertension plate disclaimer", () => {
    const p = portionsForKcal(BASE, {
      id: "x",
      name: "X",
      relation: "adult",
      condition: "hypertension",
    });
    expect(p.doctorNote).toBe(CONDITION_PLATE_PRESETS.hypertension.clinicalDisclaimer);
    expect(p.doctorNote).toContain("cardiologist");
  });

  test("portion math: rice bati = grain share rounded to 0.5", () => {
    const p = portionsForKcal(BASE, { id: "a", name: "A", relation: "adult" });
    // 1800 * 0.35 / 260 = 2.42 → round to nearest 0.5 → 2.5
    expect(p.riceBati).toBe(2.5);
    expect(p.proteinServings).toBe(Math.round((1800 * 0.25) / 150));
  });

  test("no members returns empty portions, same menu", () => {
    const { menu, portions } = buildFamilyMenu(BASE, []);
    expect(menu.length).toBe(3);
    expect(portions).toEqual([]);
  });
});
