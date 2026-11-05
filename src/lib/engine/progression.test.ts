import { describe, expect, test } from "bun:test";
import {
  ACTIVITY_PYRAMID_TIERS,
  BEGINNER_WALK_PLAN,
  getBeginnerWalkStage,
  getBeginnerWalkKcal,
} from "./progression";

describe("Beginner Walk Progression & Activity Pyramid (FR-D-08)", () => {
  test("pyramid contains all 4 tiers from base to peak with both language labels", () => {
    expect(ACTIVITY_PYRAMID_TIERS).toHaveLength(4);
    for (const tier of ACTIVITY_PYRAMID_TIERS) {
      expect(tier.titleEn.length).toBeGreaterThan(0);
      expect(tier.titleBn.length).toBeGreaterThan(0);
      expect(tier.frequencyEn.length).toBeGreaterThan(0);
      expect(tier.frequencyBn.length).toBeGreaterThan(0);
      expect(tier.examplesEn.length).toBeGreaterThan(0);
      expect(tier.examplesBn.length).toBeGreaterThan(0);
      expect(tier.guidelineNoteEn.length).toBeGreaterThan(0);
      expect(tier.guidelineNoteBn.length).toBeGreaterThan(0);
    }
  });

  test("beginner walk plan steps up from 10 to 30 minutes culminating in 150 min/wk", () => {
    expect(BEGINNER_WALK_PLAN).toHaveLength(4);
    expect(BEGINNER_WALK_PLAN[0].dailyMinutes).toBe(10);
    expect(BEGINNER_WALK_PLAN[1].dailyMinutes).toBe(15);
    expect(BEGINNER_WALK_PLAN[2].dailyMinutes).toBe(20);
    expect(BEGINNER_WALK_PLAN[3].dailyMinutes).toBe(30);
    expect(BEGINNER_WALK_PLAN[3].weeklyGoalMinutes).toBe(150);
  });

  test("getBeginnerWalkStage clamps out-of-range weeks safely", () => {
    expect(getBeginnerWalkStage(0).week).toBe(1);
    expect(getBeginnerWalkStage(1).week).toBe(1);
    expect(getBeginnerWalkStage(3).week).toBe(3);
    expect(getBeginnerWalkStage(10).week).toBe(4);
  });

  test("getBeginnerWalkKcal produces positive non-zero range matching MET calculations", () => {
    const range = getBeginnerWalkKcal(15, 65);
    expect(range.low).toBeGreaterThan(0);
    expect(range.high).toBeGreaterThan(range.low);
  });
});

