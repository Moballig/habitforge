/**
 * Wave 6: Condition-Aware Deshi Plate Presets (FR-G-01 & FR-G-02).
 * Derived from the National Dietary Guidelines for Bangladesh (WHO SEARO / NNS Aug 2025)
 * and ICMR-NIN Dietary Guidelines for South Asians.
 *
 * Deterministic ratios: No LLM halluncinations. All medical recommendations carry
 * mandatory non-diagnostic disclaimers.
 */

export type HealthCondition = "general" | "diabetes" | "hypertension";

export interface ConditionPlatePreset {
  id: HealthCondition;
  titleEn: string;
  titleBn: string;
  descriptionEn: string;
  descriptionBn: string;
  ratios: {
    veg: number; // 0..1 (vegetables + greens + whole fruit)
    protein: number; // 0..1 (fish, dal, egg, lean poultry)
    grains: number; // 0..1 (rice, ruti, coarse grains)
    other: number; // 0..1 (dairy, healthy fats, extras)
  };
  keyRulesEn: string[];
  keyRulesBn: string[];
  recommendedFoods: Array<{ nameEn: string; nameBn: string; note: string }>;
  restrictedFoods: Array<{ nameEn: string; nameBn: string; reason: string }>;
  guidelineSource: string;
  clinicalDisclaimer: string;
}

export const CONDITION_PLATE_PRESETS: Record<HealthCondition, ConditionPlatePreset> = {
  general: {
    id: "general",
    titleEn: "National Balanced Deshi Plate",
    titleBn: "জাতীয় সুষম দেশি থালা",
    descriptionEn:
      "Standard healthy plate recommended for Bangladeshi adults: half plate non-starchy vegetables & shak, quarter plate fish/pulses/protein, quarter plate whole grains.",
    descriptionBn:
      "বাংলাদেশি প্রাপ্তবয়স্কদের জন্য জাতীয় স্বাস্থ্য নির্দেশিকা অনুযায়ী: প্লেটের অর্ধেক শাক-সবজি, এক-চতুর্থাংশ মাছ-ডাল-প্রোটিন, এক-চতুর্থাংশ ভাত বা রুটি।",
    ratios: {
      veg: 0.5,
      protein: 0.25,
      grains: 0.25,
      other: 0.0,
    },
    keyRulesEn: [
      "Fill half your plate with colorful vegetables and green leafy shak",
      "Include a portion of small fish, pulses (dal), or egg at lunch and dinner",
      "Limit white refined rice to 1 standard bati (150–200g cooked) per main meal",
      "Drink at least 8 glasses of pure water daily",
    ],
    keyRulesBn: [
      "প্লেটের অর্ধেকটা রঙিন শাক-সবজি দিয়ে পূর্ণ করুন",
      "দুপুর ও রাতের খাবারে ছোট মাছ, মসুর/মুগ ডাল বা ডিম রাখুন",
      "প্রধান খাবারে সাদা ভাত ১ বাটি (১৫০-২০০ গ্রাম) এর মধ্যে সীমাবদ্ধ রাখুন",
      "প্রতিদিন কমপক্ষে ৮ গ্লাস বিশুদ্ধ পানি পান করুন",
    ],
    recommendedFoods: [
      { nameEn: "Lal shak & Pui shak", nameBn: "লাল শাক ও পুঁই শাক", note: "Rich in vitamin A, iron and dietary fiber" },
      { nameEn: "Small indigenous fish (Mola, Dhela)", nameBn: "ছোট মাছ (মোলা, ঢেলা)", note: "Eaten with bones for bioavailable calcium" },
      { nameEn: "Musur / Mug dal", nameBn: "মসুর ও মুগ ডাল", note: "Affordable plant protein" },
      { nameEn: "Parboiled coarse rice", nameBn: "সিদ্ধ লাল/মোটা চালের ভাত", note: "Lower glycemic response than polished miniket" },
    ],
    restrictedFoods: [
      { nameEn: "Deep-fried snacks (Singara, Piyaju)", nameBn: "ভাজাপোড়া (সিঙ্গাড়া, পিয়াজু)", reason: "Excess trans-fats and reused palm oil" },
      { nameEn: "Sweetened tea & soft drinks", nameBn: "মিষ্টি চা ও কোমল পানীয়", reason: "Free sugars driving rapid insulin spikes" },
    ],
    guidelineSource: "National Dietary Guidelines for Bangladesh (WHO SEARO / NNS 2025)",
    clinicalDisclaimer:
      "This balanced plate guideline promotes overall wellness and does not replace medical advice.",
  },

  diabetes: {
    id: "diabetes",
    titleEn: "Diabetes & Glycemic Balance Plate (FR-G-01)",
    titleBn: "ডায়াবেটিস ও গ্লাইসেমিক নিয়ন্ত্রিত থালা",
    descriptionEn:
      "Engineered to blunt post-meal blood glucose spikes: 50% non-starchy leafy greens and high-fiber vegetables, 25% lean protein/dal, and 25% controlled low-GI carbohydrate.",
    descriptionBn:
      "খাবার পরবর্তী রক্তে শর্করার মাত্রা নিয়ন্ত্রণে রাখার বিশেষ থালা: অর্ধেক প্লেট আঁশযুক্ত শাক-সবজি ও তেতো করলা, এক-চতুর্থাংশ ডাল ও মাছ-ডিম, এক-চতুর্থাংশ লাল চাল বা লাল আটার রুটি।",
    ratios: {
      veg: 0.5,
      protein: 0.25,
      grains: 0.25,
      other: 0.0,
    },
    keyRulesEn: [
      "Strictly 50% non-starchy greens: Pui shak, Dherosh (okra), Korola (bitter gourd), Lau",
      "Pair carb with protein & fat to slow carbohydrate absorption",
      "Switch from polished fine miniket to parboiled coarse rice (Lal chal) or whole-wheat ruti",
      "Cap rice at 1 medium bati (~150g cooked) — never heap rice",
      "Avoid juices and sugar; consume whole local fruits (amra, guava, green apple)",
    ],
    keyRulesBn: [
      "প্লেটের ৫০% নিশ্চিত আঁশযুক্ত সবজি: ঢেঁড়শ, করলা, লাউ, পুঁই শাক",
      "শর্করার শোষণ ধীর করতে ভাতের সাথে পর্যাপ্ত ডাল ও প্রোটিন খান",
      "মিনিকেট ভাতের বদলে লাল চালের ভাত অথবা আটার রুটি বেছে নিন",
      "ভাত ১ ছোট বাটিতে সীমাবদ্ধ রাখুন — প্লেটে ভাতের পাহাড় বানাবেন না",
      "জুস বা মিষ্টি পরিহার করুন; গোটা দেশি ফল (আমড়া, পেয়ারা) খান",
    ],
    recommendedFoods: [
      { nameEn: "Dherosh (Okra) & Korola", nameBn: "ঢেঁড়শ ও করলা", note: "High soluble mucilage and charantin supporting insulin response" },
      { nameEn: "Mug dal / Masur dal", nameBn: "মুগ ও মসুর ডাল", note: "Low glycemic index with high protein satiety" },
      { nameEn: "Deshi freshwater fish (Rui, Katla)", nameBn: "দেশি মাছ (রুই, কাতলা)", note: "Zero carbs, high lean protein" },
      { nameEn: "Lal chal (Brown/parboiled rice)", nameBn: "লাল চালের ভাত", note: "Retains bran layer for slow starch release" },
    ],
    restrictedFoods: [
      { nameEn: "Polished Miniket & Nazirshail rice", nameBn: "মিনিকেট ও নাজিরশাইল চাল", reason: "High glycemic index (>75) triggers rapid sugar surges" },
      { nameEn: "Misti, Jilapi, Rosogolla", nameBn: "মিষ্টি, জিলাপি, রসগোল্লা", reason: "Refined sugar saturated with simple glucose" },
      { nameEn: "Sweetened condensed milk cha", nameBn: "কনডেন্সড মিল্ক চা", reason: "Liquid sugar immediately enters blood stream" },
    ],
    guidelineSource:
      "National Dietary Guidelines for Bangladesh 2025 & Diabetic Association of Bangladesh (BIRDEM)",
    clinicalDisclaimer:
      "Derived from National Dietary Guidelines for Bangladesh 2025 and BIRDEM protocols. This educational plate does NOT substitute individualized medical nutrition therapy or physician-guided medication adjustments (insulin/sulfonylurea). Consult your doctor before making dietary changes.",
  },

  hypertension: {
    id: "hypertension",
    titleEn: "Hypertension & Cardiac Sodium Watch Plate (FR-G-02)",
    titleBn: "উচ্চ রক্তচাপ ও হৃদরোগ সোডিয়াম-সচেতন থালা",
    descriptionEn:
      "DASH-adapted Bangladeshi plate focusing on sodium reduction (<5g salt/day) and potassium/magnesium abundance from green vegetables and local fruits.",
    descriptionBn:
      "লবণ ও সোডিয়াম নিয়ন্ত্রিত দেশি ড্যাশ থালা: দৈনিক ৫ গ্রামের কম লবণ, শুঁটকি ও আচার পরিহার, এবং পটাশিয়াম সমৃদ্ধ কাঁচা কলা, ডাব ও শাকসবজি।",
    ratios: {
      veg: 0.5,
      protein: 0.25,
      grains: 0.25,
      other: 0.0,
    },
    keyRulesEn: [
      "Total salt cap: Under 1 level teaspoon (5g salt = ~2000mg sodium) per day across all cooking",
      "Strictly avoid Shutki (sun-dried salted fish) and commercial/homemade Achar (oil pickles)",
      "Never add raw table salt (pata/kachha lobon) over rice or meals",
      "Prioritize high-potassium deshi staples: Kacha kola (green banana), Lebu (lime), Shak, Daab",
      "Cook with mustard or soybean oil in moderation; eliminate dalda/vanaspati",
    ],
    keyRulesBn: [
      "দৈনিক মোট লবণ ১ চা চামচ (৫ গ্রাম বা ২০০০ মিগ্রা সোডিয়াম) এর নিচে রাখুন",
      "লবণাক্ত শুঁটকি মাছ এবং অতিরিক্ত তেলের আচার কঠোরভাবে পরিহার করুন",
      "ভাতে আলাদা কাঁচা লবণ খাওয়ার অভ্যাস আজই বন্ধ করুন",
      "পটাশিয়ামযুক্ত খাবার বাড়ান: কাঁচা কলা, লেবু, দেশি শাকসবজি ও ডাবের পানি",
      "রান্নায় ডালডা সম্পূর্ণ বাদ দিন; পরিমিত সরিষা বা সয়াবিন তেল ব্যবহার করুন",
    ],
    recommendedFoods: [
      { nameEn: "Kacha kola (Green plantain)", nameBn: "কাঁচা কলা ভর্তা বা তরকারি", note: "Rich in dietary potassium and resistant starch" },
      { nameEn: "Lau & Jhinga (Gourd family)", nameBn: "লাউ ও ঝিঙা", note: "Naturally very low sodium, high water content" },
      { nameEn: "Deshi lemon (Kagoji lebu)", nameBn: "কাগজি লেবু", note: "Flavors food naturally without needing extra salt" },
      { nameEn: "Fresh freshwater fish curry", nameBn: "তাজা নদীর মাছের পাতলা ঝোল", note: "Heart-healthy omega fatty acids without sodium preservatives" },
    ],
    restrictedFoods: [
      { nameEn: "Shutki (Dried salted fish)", nameBn: "লবণাক্ত শুঁটকি", reason: "Heavily preserved with table salt (up to 4000mg sodium per 100g)" },
      { nameEn: "Achar (Mango/olive pickles)", nameBn: "তেল-লবণের আচার", reason: "Soaked in salt brine and oil" },
      { nameEn: "Packet chips & Chanachur", nameBn: "প্যাকেট চিপস ও চানাচুর", reason: "Ultra-processed industrial sodium and MSG" },
    ],
    guidelineSource:
      "National Dietary Guidelines for Bangladesh 2025 & National Heart Foundation Hospital & Research Institute",
    clinicalDisclaimer:
      "Based on WHO Bangladesh sodium guidelines and National Heart Foundation clinical standards. Sodium restriction should be coordinated with your cardiologist or nephrologist, especially if taking ACE inhibitors, ARBs, or potassium-sparing diuretics.",
  },
};

/**
 * Determine matching condition plate preset from profile configuration.
 */
export function getPlatePresetForProfile(profile?: {
  eatingStyle?: string[];
  safetyScreen?: {
    insulinOrSulfonylurea?: boolean;
    heartOrKidneyDisease?: boolean;
    under18?: boolean;
    pregnancy?: boolean;
    lowBmi?: boolean;
    eatingDisorderHistory?: boolean;
  };
}): ConditionPlatePreset {
  if (!profile) return CONDITION_PLATE_PRESETS.general;

  const styles = (profile.eatingStyle ?? []).map((s) => s.toLowerCase());
  const screen = profile.safetyScreen ?? {};

  // Check diabetes priority
  if (
    screen.insulinOrSulfonylurea ||
    styles.some((s) => s.includes("diabet") || s.includes("sugar") || s.includes("glucose"))
  ) {
    return CONDITION_PLATE_PRESETS.diabetes;
  }

  // Check hypertension / cardiac priority
  if (
    screen.heartOrKidneyDisease ||
    styles.some((s) => s.includes("hypertens") || s.includes("heart") || s.includes("blood pressure") || s.includes("cardiac"))
  ) {
    return CONDITION_PLATE_PRESETS.hypertension;
  }

  return CONDITION_PLATE_PRESETS.general;
}

/**
 * Compare actual consumed plate shares against recommended preset.
 * Returns difference in percentage points and an assessment.
 */
export function evaluatePlateBalance(
  actual: { veg: number; protein: number; grains: number; other: number },
  preset: ConditionPlatePreset,
) {
  const diffVeg = actual.veg - preset.ratios.veg;
  const diffProtein = actual.protein - preset.ratios.protein;
  const diffGrains = actual.grains - preset.ratios.grains;

  let adviceEn = "Your plate is close to the recommended balance.";
  let adviceBn = "আপনার থালার ভারসাম্য নির্দেশিকার বেশ কাছাকাছি।";

  if (actual.grains > preset.ratios.grains + 0.15) {
    adviceEn = "Rice/grain portion is currently dominating your plate. Try reducing 1/3 of rice and replacing with shak or dal.";
    adviceBn = "ভাতের পরিমাণ প্লেটে বেশি হয়ে যাচ্ছে। ভাতের এক-তৃতীয়াংশ কমিয়ে বেশি শাক বা ডাল যোগ করুন।";
  } else if (actual.veg < preset.ratios.veg - 0.15) {
    adviceEn = "Vegetable and leafy green intake is lower than targeted. Add a khati bati of seasonal shak or bhaji.";
    adviceBn = "সবজি ও শাকের পরিমাণ কম রয়েছে। এক বাটি দেশি শাক বা লাউ-ঝিঙা তরকারি যোগ করলে চমৎকার ভারসাম্য আসবে।";
  } else if (actual.protein < preset.ratios.protein - 0.1) {
    adviceEn = "Protein share is slightly light. Consider an egg, small fish, or thick dal to preserve lean muscle.";
    adviceBn = "প্রোটিন কিছুটা কম। একটি ডিম, দেশি মাছ বা ঘন ডাল যোগ করলে পেশির শক্তি বজায় থাকবে।";
  }

  return {
    diffVeg,
    diffProtein,
    diffGrains,
    isWellBalanced: Math.abs(diffVeg) <= 0.15 && Math.abs(diffGrains) <= 0.15,
    adviceEn,
    adviceBn,
  };
}
