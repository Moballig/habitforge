import { describe, expect, test } from "bun:test";
import { BD_REGIONS, getRegionCoords } from "./context";

describe("Bangladesh Region Coordinates", () => {
  test("all 8 administrative divisions exist with realistic lat/long in BD bounding box", () => {
    const keys = Object.keys(BD_REGIONS);
    expect(keys.length).toBe(8);

    for (const key of keys) {
      const region = BD_REGIONS[key as keyof typeof BD_REGIONS];
      expect(region.nameEn).toBeTruthy();
      expect(region.nameBn).toBeTruthy();
      // Bangladesh bounding box: lat ~ 20.5 to 26.7, lon ~ 88.0 to 92.7
      expect(region.lat).toBeGreaterThanOrEqual(20.5);
      expect(region.lat).toBeLessThanOrEqual(26.7);
      expect(region.lon).toBeGreaterThanOrEqual(88.0);
      expect(region.lon).toBeLessThanOrEqual(92.7);
    }
  });

  test("getRegionCoords falls back to Dhaka on missing or unknown region", () => {
    const fallbackNull = getRegionCoords(null);
    expect(fallbackNull.id).toBe("dhaka");
    expect(fallbackNull.lat).toBeCloseTo(23.8103, 3);

    const fallbackUnknown = getRegionCoords("paris");
    expect(fallbackUnknown.id).toBe("dhaka");

    const ctg = getRegionCoords("chattogram");
    expect(ctg.id).toBe("chattogram");
    expect(ctg.lat).toBeCloseTo(22.3569, 3);
  });
});

