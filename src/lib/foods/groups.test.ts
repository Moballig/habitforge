import { describe, expect, test } from "bun:test";
import { FOOD_SEED } from "./seed";
import { plateGroupFor } from "./groups";

describe("plateGroupFor", () => {
  test("maps every seed row to a group", () => {
    const counts = { veg: 0, protein: 0, grains: 0, other: 0 };
    for (const f of FOOD_SEED) counts[plateGroupFor(f.nameEn)]++;
    expect(counts.grains).toBe(20);
    expect(counts.veg).toBe(74); // vegetables (38) + more veg (12) + fruits (24)
    expect(counts.protein).toBe(96); // pulses 15+10, fish 21+10, meat 20+12, eggs in meat, dairy 8
    expect(counts.other).toBe(128); // total 318
    expect(counts.veg + counts.protein + counts.grains + counts.other).toBe(FOOD_SEED.length);
  });

  test("section boundaries land in the right group", () => {
    expect(plateGroupFor(FOOD_SEED[0]!.nameEn)).toBe("grains"); // rice
    expect(plateGroupFor(FOOD_SEED[19]!.nameEn)).toBe("grains"); // last grain
    expect(plateGroupFor(FOOD_SEED[20]!.nameEn)).toBe("protein"); // first dal
    expect(plateGroupFor(FOOD_SEED[76]!.nameEn)).toBe("veg"); // first vegetable
    expect(plateGroupFor(FOOD_SEED[114]!.nameEn)).toBe("other"); // first dairy & drinks
    expect(plateGroupFor(FOOD_SEED[317]!.nameEn)).toBe("other"); // last mixed dish
  });

  test("unknown foods count as other", () => {
    expect(plateGroupFor("Mystery curry")).toBe("other");
  });
});
