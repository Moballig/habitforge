import { describe, expect, test } from "bun:test";
import { SMALL_SPACE_ROUTINES, getSmallSpaceRoutineKcal } from "./smallSpace";

describe("No-Equipment & Small-Space Apartment Workouts (FR-D-04)", () => {
  test("every routine specifies small space, low noise, and positive MET", () => {
    expect(SMALL_SPACE_ROUTINES.length).toBe(4);

    for (const routine of SMALL_SPACE_ROUTINES) {
      expect(routine.titleEn).toBeTruthy();
      expect(routine.titleBn).toBeTruthy();
      expect(routine.durationMin).toBeGreaterThanOrEqual(10);
      expect(routine.durationMin).toBeLessThanOrEqual(30);
      expect(routine.met).toBeGreaterThan(1.5);
      expect(["silent", "ultra_low", "low"]).toContain(routine.noiseLevel);
      expect(["walk", "home", "yoga"]).toContain(routine.activityType);
      expect(routine.exercises.length).toBeGreaterThanOrEqual(2);

      for (const ex of routine.exercises) {
        expect(ex.nameEn).toBeTruthy();
        expect(ex.nameBn).toBeTruthy();
        expect(ex.repsOrTimeEn).toBeTruthy();
      }
    }
  });

  test("calculates sensible net kcal bounds using weight and MET", () => {
    const bodyweight = SMALL_SPACE_ROUTINES.find((r) => r.id === "low_noise_bodyweight")!;
    const kcal = getSmallSpaceRoutineKcal(bodyweight, 70); // 70 kg, 20 min, MET 3.8

    // Net MET = 2.8. netKcal = 2.8 * 70 * (20/60) = 65.3 kcal net. ±15% band: ~56 to 75
    expect(kcal.low).toBeGreaterThanOrEqual(50);
    expect(kcal.high).toBeLessThanOrEqual(85);
    expect(kcal.low).toBeLessThan(kcal.high);
  });
});

