import { describe, expect, test } from "bun:test";
import {
  calculatePrayerTimes,
  getSafeActivitySlots,
  getCurrentSlot,
} from "./prayerTimes";

describe("Prayer Times and Ramadan Safe Activity Scheduling (FR-D-06)", () => {
  test("calculates chronological prayer times for Dhaka", () => {
    const times = calculatePrayerTimes(new Date("2026-11-05T12:00:00Z"), "dhaka");
    expect(times.fajr).toMatch(/\d{2}:\d{2} AM/);
    expect(times.dhuhr).toMatch(/\d{2}:\d{2} [AP]M/);
    expect(times.asr).toMatch(/\d{2}:\d{2} PM/);
    expect(times.maghrib).toMatch(/\d{2}:\d{2} PM/);
    expect(times.isha).toMatch(/\d{2}:\d{2} PM/);

    const { fajr, dhuhr, asr, maghrib, isha } = times.rawMinutes;
    expect(fajr).toBeLessThan(dhuhr);
    expect(dhuhr).toBeLessThan(asr);
    expect(asr).toBeLessThan(maghrib);
    expect(maghrib).toBeLessThan(isha);
  });

  test("computes distinct prayer times across divisions (Sylhet earlier sunset than Rajshahi)", () => {
    // Sylhet is ~91.87° E, Rajshahi is ~88.62° E (~3.25° diff ≈ 13 minutes solar difference)
    const sylhet = calculatePrayerTimes(new Date("2026-11-05T12:00:00Z"), "sylhet");
    const rajshahi = calculatePrayerTimes(new Date("2026-11-05T12:00:00Z"), "rajshahi");

    expect(sylhet.rawMinutes.maghrib).toBeLessThan(rajshahi.rawMinutes.maghrib);
    const diff = rajshahi.rawMinutes.maghrib - sylhet.rawMinutes.maghrib;
    expect(diff).toBeGreaterThanOrEqual(10);
    expect(diff).toBeLessThanOrEqual(16);
  });

  test("generates safe activity slots with fasting safety rules", () => {
    const times = calculatePrayerTimes(new Date("2026-11-05T12:00:00Z"), "dhaka");
    const slots = getSafeActivitySlots(times, true);

    expect(slots.length).toBe(4);
    const preMaghrib = slots.find((s) => s.id === "pre_maghrib");
    expect(preMaghrib).toBeDefined();
    // In fasting mode, pre-maghrib must be walk-only to prevent sweat/dehydration
    expect(preMaghrib?.intensity).toBe("walk_only");

    const postIftar = slots.find((s) => s.id === "post_iftar");
    expect(postIftar).toBeDefined();
    expect(postIftar?.intensity).toBe("light");
    expect(postIftar?.ramadanNoteEn).toContain("Avoid running");
  });

  test("accurately detects current active or next upcoming slot", () => {
    const times = calculatePrayerTimes(new Date("2026-11-05T12:00:00Z"), "dhaka");
    const slots = getSafeActivitySlots(times, false);

    // 6:00 AM (360 minutes from midnight) -> usually in post-Fajr window
    const earlyMorning = getCurrentSlot(slots, 360);
    expect(earlyMorning.activeSlot?.id).toBe("post_fajr");

    // 12:00 PM (720 minutes from midnight) -> midday, between windows
    const midday = getCurrentSlot(slots, 720);
    expect(midday.activeSlot).toBeNull();
    expect(midday.nextSlot.id).toBe("pre_maghrib");
  });
});

