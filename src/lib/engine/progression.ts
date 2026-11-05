import { netKcalRange, ACTIVITY_METS } from "./mets";

export interface PyramidTier {
  level: number;
  frequencyEn: string;
  frequencyBn: string;
  titleEn: string;
  titleBn: string;
  examplesEn: string[];
  examplesBn: string[];
  guidelineNoteEn: string;
  guidelineNoteBn: string;
  tone: "mint" | "sky" | "lilac" | "peach";
}

/** Official 4-tier Physical Activity Pyramid (National Dietary Guidelines for Bangladesh 2025). */
export const ACTIVITY_PYRAMID_TIERS: PyramidTier[] = [
  {
    level: 4,
    frequencyEn: "Cut down",
    frequencyBn: "যতটা সম্ভব কমান",
    titleEn: "Sedentary Behavior",
    titleBn: "স্থবিরতা ও বসে থাকা",
    examplesEn: ["Sitting continuously >2 hours", "Passive screen scrolling", "Lying down while awake"],
    examplesBn: ["একটানা ২ ঘণ্টার বেশি বসে থাকা", "মোবাইলে অলস স্ক্রলিং", "জেগে থাকা অবস্থায় শুয়ে থাকা"],
    guidelineNoteEn: "Break prolonged sitting every 30–60 minutes with 2 minutes of standing or pacing.",
    guidelineNoteBn: "প্রতি ৩০–৬০ মিনিট একটানা বসার পর অন্তত ২ মিনিট দাঁড়িয়ে বা হেঁটে বিরতি নিন।",
    tone: "peach",
  },
  {
    level: 3,
    frequencyEn: "2–3 days / week",
    frequencyBn: "সপ্তাহে ২–৩ দিন",
    titleEn: "Flexibility & Muscle Strength",
    titleBn: "শক্তি ও নমনীয়তা চর্চা",
    examplesEn: ["Bodyweight squats & lunges", "Wall or floor push-ups", "Stretching & yoga"],
    examplesBn: ["বডিওয়েট স্কোয়াট ও লাঞ্জ", "দেয়াল বা ফ্লোর পুশ-আপ", "স্ট্রেচিং ও যোগাসন"],
    guidelineNoteEn: "Maintains muscle mass and joint mobility essential for healthy Asian metabolic aging.",
    guidelineNoteBn: "পেশির শক্তি ও হাড়ের জোড়া সক্রিয় রাখতে অপরিহার্য।",
    tone: "lilac",
  },
  {
    level: 2,
    frequencyEn: "3–5 days / week (150 min)",
    frequencyBn: "সপ্তাহে ৩–৫ দিন (১৫০ মি.)",
    titleEn: "Cardiorespiratory & Aerobic",
    titleBn: "কার্ডিও ও বায়বীয় ব্যায়াম",
    examplesEn: ["Brisk walking (30 min)", "Cycling", "Recreational badminton / swimming"],
    examplesBn: ["দ্রুত হাঁটা (৩০ মিনিট)", "সাইক্লিং", "ব্যাডমিন্টন বা সাঁতার"],
    guidelineNoteEn: "National guideline target for insulin sensitivity and cardiovascular health.",
    guidelineNoteBn: "ইনসুলিন সংবেদনশীলতা ও হৃদযন্ত্রের সুরক্ষায় জাতীয় নির্দেশিকার মূল লক্ষ্য।",
    tone: "sky",
  },
  {
    level: 1,
    frequencyEn: "Every day (base)",
    frequencyBn: "প্রতিদিনের মূল ভিত্তি",
    titleEn: "Active Daily Living",
    titleBn: "দৈনন্দিন সক্রিয় জীবনযাপন",
    examplesEn: ["Taking stairs instead of lift", "Walking to local bazar or masjid", "Domestic household chores"],
    examplesBn: ["লিফটের বদলে সিঁড়ি ব্যবহার", "কাছের বাজার বা মসজিদে হেঁটে যাওয়া", "ঘরের স্বাভাবিক কাজকর্ম"],
    guidelineNoteEn: "The foundation of sustainable energy balance without requiring dedicated gym time.",
    guidelineNoteBn: "জিমে না গিয়েও প্রাত্যহিক ক্যালোরি খরচের সবচেয়ে টেকসই ভিত্তি।",
    tone: "mint",
  },
];

export interface BeginnerWalkStage {
  week: number;
  dailyMinutes: number;
  frequencyDays: number;
  weeklyGoalMinutes: number;
  focusEn: string;
  focusBn: string;
  tipEn: string;
  tipBn: string;
}

/** 4-week step-up schedule (10 → 30 min) aligned with Bangladesh National Nutrition Services guidelines. */
export const BEGINNER_WALK_PLAN: BeginnerWalkStage[] = [
  {
    week: 1,
    dailyMinutes: 10,
    frequencyDays: 5,
    weeklyGoalMinutes: 50,
    focusEn: "Habit formation & gentle rhythm",
    focusBn: "অভ্যাস তৈরি ও সহজ ছন্দ",
    tipEn: "Start at a conversational pace. Do not rush; the goal is simply stepping out daily.",
    tipBn: "কথা বলা যায় এমন স্বাভাবিক গতিতে শুরু করুন। তাড়াহুড়ো না করে প্রতিদিন শুরু করাই আসল।",
  },
  {
    week: 2,
    dailyMinutes: 15,
    frequencyDays: 5,
    weeklyGoalMinutes: 75,
    focusEn: "Posture awareness & breathing cadence",
    focusBn: "সোজা ভঙ্গি ও স্বাভাবিক শ্বাস-প্রশ্বাস",
    tipEn: "Keep shoulders relaxed and back straight. Add 5 brisk minutes in the middle.",
    tipBn: "কাঁধ রিল্যাক্স রেখে সোজা হয়ে হাঁটুন। মাঝের ৫ মিনিট কিছুটা দ্রুত পা ফেলুন।",
  },
  {
    week: 3,
    dailyMinutes: 20,
    frequencyDays: 5,
    weeklyGoalMinutes: 100,
    focusEn: "Building aerobic stamina (2/3 goal)",
    focusBn: "স্ট্যামিনা বৃদ্ধি (জাতীয় লক্ষ্যের ২/৩ অংশ)",
    tipEn: "Noticeably lighter post-walk mood. Split into two 10-minute bouts if time is tight.",
    tipBn: "সময় কম থাকলে সকালে ১০ মিনিট এবং বিকেলে ১০ মিনিট ভাগ করে নিতে পারেন।",
  },
  {
    week: 4,
    dailyMinutes: 30,
    frequencyDays: 5,
    weeklyGoalMinutes: 150,
    focusEn: "National 150 min/week target achieved",
    focusBn: "জাতীয় লক্ষ্যমাত্রা (১৫০ মিনিট/সপ্তাহ) অর্জন",
    tipEn: "Congratulations! You have reached the official WHO / BD guideline recommendation.",
    tipBn: "অভিনন্দন! আপনি জাতীয় ও বিশ্ব স্বাস্থ্য সংস্থার সুনির্দিষ্ট লক্ষ্যমাত্রায় পৌঁছে গেছেন।",
  },
];

export function getBeginnerWalkStage(weekNumber: number): BeginnerWalkStage {
  const clamped = Math.max(1, Math.min(4, Math.floor(weekNumber || 1)));
  return BEGINNER_WALK_PLAN[clamped - 1];
}

export function getBeginnerWalkKcal(
  minutes: number,
  weightKg: number,
): { low: number; high: number } {
  return netKcalRange(ACTIVITY_METS.walk, weightKg, minutes);
}
