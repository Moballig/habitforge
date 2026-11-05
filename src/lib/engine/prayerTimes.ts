import { BD_REGIONS, type BdDivision, getRegionCoords } from "./context";

export interface PrayerTimes {
  fajr: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  rawMinutes: {
    fajr: number;
    dhuhr: number;
    asr: number;
    maghrib: number;
    isha: number;
  };
}

export interface ActivitySlot {
  id: "post_fajr" | "pre_maghrib" | "post_iftar" | "post_taraweeh";
  labelEn: string;
  labelBn: string;
  windowStr: string;
  startMinutes: number;
  endMinutes: number;
  intensity: "light" | "moderate" | "walk_only";
  guidanceEn: string;
  guidanceBn: string;
  recommendedTypes: ("walk" | "yoga" | "home" | "cycle")[];
  ramadanNoteEn: string;
  ramadanNoteBn: string;
}

function toMinutes(date: Date, hours: number, minutes: number): number {
  return hours * 60 + minutes;
}

function formatMinutes(mins: number): string {
  const norm = ((Math.round(mins) % 1440) + 1440) % 1440;
  const h = Math.floor(norm / 60);
  const m = Math.floor(norm % 60);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`;
}

/**
 * Computes deterministic solar prayer times for Bangladesh administrative divisions.
 * Uses Karachi/Islamic Foundation Bangladesh parameters (18° Fajr/Isha, Hanafi shadow factor 2).
 */
export function calculatePrayerTimes(date: Date, region?: string | null): PrayerTimes {
  const coords = getRegionCoords(region);
  const lat = coords.lat;
  const lon = coords.lon;

  // Day of year
  const start = new Date(Date.UTC(date.getFullYear(), 0, 0));
  const diff = date.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

  // Solar declination & Equation of Time (Spencer/Woolf approximations)
  const B = (2 * Math.PI * (dayOfYear - 81)) / 365;
  const eot = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B); // in minutes
  const declination = 23.45 * Math.sin(B) * (Math.PI / 180); // in radians

  // Solar noon in Bangladesh Standard Time (UTC+6, 90° E meridian)
  const standardMeridian = 90.0;
  const timeCorrection = 4 * (standardMeridian - lon) - eot; // minutes
  const solarNoonMinutes = 12 * 60 + timeCorrection;

  const radLat = lat * (Math.PI / 180);

  function hourAngle(altitudeDeg: number): number {
    const radAlt = altitudeDeg * (Math.PI / 180);
    const cosHA =
      (Math.sin(radAlt) - Math.sin(radLat) * Math.sin(declination)) /
      (Math.cos(radLat) * Math.cos(declination));
    if (cosHA >= 1) return 0;
    if (cosHA <= -1) return 180 * 4;
    return Math.acos(cosHA) * (180 / Math.PI) * 4; // minutes
  }

  const sunsetHA = hourAngle(-0.833);
  const fajrHA = hourAngle(-18.0);
  const ishaHA = hourAngle(-18.0);

  // Asr altitude: Hanafi (shadow length = 2 + noon shadow)
  const asrAlt =
    Math.atan(1 / (2 + Math.tan(Math.abs(radLat - declination)))) * (180 / Math.PI);
  const asrHA = hourAngle(asrAlt);

  const fajrM = solarNoonMinutes - fajrHA;
  const dhuhrM = solarNoonMinutes;
  const asrM = solarNoonMinutes + asrHA;
  const maghribM = solarNoonMinutes + sunsetHA;
  const ishaM = solarNoonMinutes + ishaHA;

  return {
    fajr: formatMinutes(fajrM),
    dhuhr: formatMinutes(dhuhrM),
    asr: formatMinutes(asrM),
    maghrib: formatMinutes(maghribM),
    isha: formatMinutes(ishaM),
    rawMinutes: {
      fajr: Math.round(fajrM),
      dhuhr: Math.round(dhuhrM),
      asr: Math.round(asrM),
      maghrib: Math.round(maghribM),
      isha: Math.round(ishaM),
    },
  };
}

/**
 * Generates culturally and clinically safe exercise slots (FR-D-06).
 * Accommodates daily prayer obligations and fasting hydration safety.
 */
export function getSafeActivitySlots(
  times: PrayerTimes,
  isFasting: boolean = false,
): ActivitySlot[] {
  const { fajr, asr, maghrib, isha } = times.rawMinutes;

  const postFajrStart = fajr + 30;
  const postFajrEnd = fajr + 95;

  const preMaghribStart = asr + 40;
  const preMaghribEnd = maghrib - 15;

  const postIftarStart = maghrib + 45;
  const postIftarEnd = maghrib + 85;

  const postTaraweehStart = isha + 75;
  const postTaraweehEnd = isha + 140;

  return [
    {
      id: "post_fajr",
      labelEn: "Post-Fajr Morning Walk",
      labelBn: "ফজরের পর ভোরের শান্ত হাঁটা",
      windowStr: `${formatMinutes(postFajrStart)} – ${formatMinutes(postFajrEnd)}`,
      startMinutes: postFajrStart,
      endMinutes: postFajrEnd,
      intensity: "moderate",
      guidanceEn:
        "Cool morning air and lowest daily air pollution. Ideal for a 20–30 min brisk walk or light stretching.",
      guidanceBn:
        "দিনের সবচেয়ে শীতল বাতাস ও কম দূষণ। ২০–৩০ মিনিট সতেজ হাঁটা বা হালকা স্ট্রেচিংয়ের চমৎকার সময়।",
      recommendedTypes: ["walk", "yoga"],
      ramadanNoteEn:
        "Optimal morning window while Sehri hydration is still high. Keep intensity comfortable.",
      ramadanNoteBn:
        "সেহরির পর শরীরে পর্যাপ্ত পানি থাকে। স্বাভাবিক গতি বজায় রেখে শান্তভাবে হাঁটুন।",
    },
    {
      id: "pre_maghrib",
      labelEn: "Pre-Sunset Gentle Stroll",
      labelBn: "মাগরিবের আগে হালকা চলাচল",
      windowStr: `${formatMinutes(preMaghribStart)} – ${formatMinutes(preMaghribEnd)}`,
      startMinutes: preMaghribStart,
      endMinutes: preMaghribEnd,
      intensity: isFasting ? "walk_only" : "light",
      guidanceEn:
        "Gentle, relaxed stroll before dusk. Helps refresh energy before the evening meal.",
      guidanceBn:
        "সন্ধ্যার পূর্বে ক্লান্তি দূর করতে হালকা পদচারণা। কোনো ভারী ঘামঝরানো ব্যায়াম নয়।",
      recommendedTypes: ["walk"],
      ramadanNoteEn:
        "Fasting safety rule: Body hydration is lowest. Strictly slow stroll only, avoid sweating.",
      ramadanNoteBn:
        "রোজার সতর্কতা: শরীরে পানির পরিমাণ সর্বনিম্ন থাকে। শুধুমাত্র ধীরেসুস্থে হাঁটা, ভারী কসরত এড়িয়ে চলুন।",
    },
    {
      id: "post_iftar",
      labelEn: "Post-Iftar Digestive Walk",
      labelBn: "ইফতারের পর হজম সহায়ক হাঁটা",
      windowStr: `${formatMinutes(postIftarStart)} – ${formatMinutes(postIftarEnd)}`,
      startMinutes: postIftarStart,
      endMinutes: postIftarEnd,
      intensity: "light",
      guidanceEn:
        "45 minutes after iftar meal: A 15–20 min relaxed walk blunts glucose spikes and prevents sluggishness.",
      guidanceBn:
        "ইফতারের ৪৫ মিনিট পর: ১৫–২০ মিনিট হালকা হাঁটা রক্তে সুগার স্পাইক কমায় ও জড়তা কাটায়।",
      recommendedTypes: ["walk"],
      ramadanNoteEn:
        "Drink a glass of water before heading out. Avoid running or core compression after eating.",
      ramadanNoteBn:
        "হাঁটার আগে ১ গ্লাস পানি পান করুন। ভরা পেটে তীব্র গতিতে দৌড়াবেন না।",
    },
    {
      id: "post_taraweeh",
      labelEn: "Post-Taraweeh Active Session",
      labelBn: "তারাবির পর কর্মক্ষম সময়",
      windowStr: `${formatMinutes(postTaraweehStart)} – ${formatMinutes(postTaraweehEnd)}`,
      startMinutes: postTaraweehStart,
      endMinutes: postTaraweehEnd,
      intensity: "moderate",
      guidanceEn:
        "After night prayers: Best time for structured indoor bodyweight work, rooftop walking, or yoga.",
      guidanceBn:
        "তারাবি ও এশার নামাজের পর: ইনডোর বডিওয়েট এক্সারসাইজ, ছাদে হাঁটা বা যোগব্যায়ামের সেরা সময়।",
      recommendedTypes: ["home", "walk", "yoga"],
      ramadanNoteEn:
        "Fully rehydrated window. Drink 250–500 ml water across your session.",
      ramadanNoteBn:
        "শরীর তখন হাইড্রেটেড থাকে। সেশন চলাকালীন ২৫০–৫০০ মিলি পানি পান করুন।",
    },
  ];
}

/**
 * Finds the currently relevant activity slot based on time of day (minutes from midnight).
 */
export function getCurrentSlot(slots: ActivitySlot[], currentMinutes: number): {
  activeSlot: ActivitySlot | null;
  nextSlot: ActivitySlot;
} {
  for (const slot of slots) {
    if (currentMinutes >= slot.startMinutes && currentMinutes <= slot.endMinutes) {
      return { activeSlot: slot, nextSlot: slot };
    }
  }

  // Find next upcoming slot today
  for (const slot of slots) {
    if (slot.startMinutes > currentMinutes) {
      return { activeSlot: null, nextSlot: slot };
    }
  }

  // Wrap around to the first slot tomorrow
  return { activeSlot: null, nextSlot: slots[0] };
}

