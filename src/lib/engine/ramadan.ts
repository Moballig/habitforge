/**
 * Ramadan & Fasting Nutrition / Rebalancing Mode (Wave 6 - FR-G-03)
 * Provides culturally tuned fasting scheduling, hydration pacing, and ensures
 * zero-deficit pressure (fasting mode disables automatic calorie restriction).
 */

export interface FastingSchedule {
  sehriEndsTime: string; // e.g. "04:55 AM"
  iftarTime: string; // e.g. "06:12 PM"
  fastingHours: number; // e.g. 13.3
  eatingWindowHours: number; // e.g. 10.7
  hydrationTargetGlasses: number; // e.g. 8-10 glasses paced across eating window
  hydrationSlots: {
    timeLabelBn: string;
    timeLabelEn: string;
    targetGlasses: number;
    recommended: string;
  }[];
  mealPacing: {
    slot: "iftar" | "post_prayer_dinner" | "sehri";
    calorieSharePercent: number;
    recommendationBn: string;
    recommendationEn: string;
    itemsToLimitBn: string;
    itemsToLimitEn: string;
  }[];
}

/**
 * Generates an individualized Ramadan/Nafal fasting plan.
 * Per the National Dietary Guidelines 2025:
 * 1. Deficits are clamped to 0 unless the user explicitly opts in.
 * 2. Hydration must be distributed between Iftar and Sehri to prevent dehydration.
 * 3. Deep-fried foods (peyaju, beguni, jilapi) are paced rather than banned.
 */
export function generateFastingPlan(userDailyKcal: number): FastingSchedule {
  // Balanced distribution of energy during Ramadan
  // Iftar: ~30%, Dinner: ~35%, Sehri: ~35%
  const iftarKcal = Math.round(userDailyKcal * 0.3);
  const dinnerKcal = Math.round(userDailyKcal * 0.35);
  const sehriKcal = Math.round(userDailyKcal * 0.35);

  return {
    sehriEndsTime: "04:58 AM",
    iftarTime: "06:08 PM",
    fastingHours: 13.2,
    eatingWindowHours: 10.8,
    hydrationTargetGlasses: 9,
    hydrationSlots: [
      {
        timeLabelEn: "At Iftar (Opening)",
        timeLabelBn: "ইফতারের শুরুতে",
        targetGlasses: 2,
        recommended: "1 glass water + 1 glass thin lemon/mint water or coconut water (no added sugar).",
      },
      {
        timeLabelEn: "Between Maghrib & Taraweeh",
        timeLabelBn: "মাগরিব ও তারাবির মাঝে",
        targetGlasses: 3,
        recommended: "Sip water gradually during resting periods.",
      },
      {
        timeLabelEn: "Post-Dinner to Bedtime",
        timeLabelBn: "রাতের খাবারের পর থেকে ঘুমানোর আগে",
        targetGlasses: 2,
        recommended: "Water or light herbal tea; avoid heavy caffeine that dehydrates.",
      },
      {
        timeLabelEn: "At Sehri (Closing)",
        timeLabelBn: "সেহরির সময়",
        targetGlasses: 2,
        recommended: "Drink comfortably with complex carbs; avoid chugging all at once.",
      },
    ],
    mealPacing: [
      {
        slot: "iftar",
        calorieSharePercent: 30,
        recommendationEn: `Target ~${iftarKcal} kcal. 1-2 dates, fresh cucumber/fruits, chola bhuna (1/2 bati), 1 light peyaju or beguni. Avoid oily barrage.`,
        recommendationBn: `লক্ষ্য ~${iftarKcal} ক্যালরি। ১-২টি খেজুর, শসা/ফল, আধা বাটি ছোলা, ১টি পিঁয়াজু বা বেগুনি। মাত্রাতিরিক্ত ভাজা খাবার এড়িয়ে চলুন।`,
        itemsToLimitEn: "Excessive fried singara, beguni, sugar syrups, halim (high sodium)",
        itemsToLimitBn: "অতিরিক্ত বেগুনি, জিলাপি, শরবতে চিনি ও মাত্রাতিরিক্ত লবণযুক্ত হালিম",
      },
      {
        slot: "post_prayer_dinner",
        calorieSharePercent: 35,
        recommendationEn: `Target ~${dinnerKcal} kcal. Balanced plate: 1 small bati rice/ruti + plenty of shak/vegetables + fish or lean chicken + thin dal.`,
        recommendationBn: `লক্ষ্য ~${dinnerKcal} ক্যালরি। সুষম প্লেট: ১ ছোট বাটি ভাত/রুটি + প্রচুর শাকসবজি + মাছ/মুরগি + পাতলা ডাল।`,
        itemsToLimitEn: "Heavy oil curries, late-night rich mutton kacchi",
        itemsToLimitBn: "অতিরিক্ত তেল-মসলাযুক্ত খাবার, গভীর রাতে ভারী কাচ্চি",
      },
      {
        slot: "sehri",
        calorieSharePercent: 35,
        recommendationEn: `Target ~${sehriKcal} kcal. Slow-release energy: Oats or red rice/ruti + egg/milk + banana. Prevents midday hunger spikes.`,
        recommendationBn: `লক্ষ্য ~${sehriKcal} ক্যালরি। দীর্ঘস্থায়ী শক্তির জন্য: লাল চালের ভাত/রুটি + ডিম/দুধ + কলা। সারাদিন তৃষ্ণা ও দুর্বলতা কমাবে।`,
        itemsToLimitEn: "Overly salty curries, pickles (they cause intense daytime thirst)",
        itemsToLimitBn: "অতিরিক্ত লবণাক্ত তরকারি, আচার (সারাদিন তীব্র পানির পিপাসা তৈরি করে)",
      },
    ],
  };
}

/**
 * Safe Ramadan energy rule:
 * If user has active Ramadan mode, deficit is strictly 0 kcal by default.
 * No user is nudged to lose weight during holy month unless explicitly confirmed.
 */
export function clampRamadanBudget(
  tdee: number,
  isRamadanMode: boolean,
  optInDeficit: boolean = false,
): { targetKcal: number; isDeficitBlocked: boolean; note: string } {
  if (isRamadanMode && !optInDeficit) {
    return {
      targetKcal: tdee,
      isDeficitBlocked: true,
      note: "Ramadan Safe Guardrail: Calorie deficit is disabled during fasting to prevent dehydration and metabolic fatigue.",
    };
  }
  return {
    targetKcal: tdee,
    isDeficitBlocked: false,
    note: "Normal energy target active.",
  };
}

