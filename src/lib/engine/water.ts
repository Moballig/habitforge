export const GLASS_ML = 250;
export const DEFAULT_DAILY_GLASSES = 8;
export const DEFAULT_DAILY_ML = DEFAULT_DAILY_GLASSES * GLASS_ML;

export interface WaterSummary {
  glasses: number;
  targetGlasses: number;
  ml: number;
  targetMl: number;
  pct: number;
  metGoal: boolean;
}

export function calculateWaterProgress(
  glasses: number,
  targetGlasses: number = DEFAULT_DAILY_GLASSES,
): WaterSummary {
  const safeGlasses = Math.max(0, Math.floor(glasses));
  const safeTarget = Math.max(1, Math.floor(targetGlasses));
  const ml = safeGlasses * GLASS_ML;
  const targetMl = safeTarget * GLASS_ML;
  const pct = Math.min(100, Math.round((safeGlasses / safeTarget) * 100));

  return {
    glasses: safeGlasses,
    targetGlasses: safeTarget,
    ml,
    targetMl,
    pct,
    metGoal: safeGlasses >= safeTarget,
  };
}

