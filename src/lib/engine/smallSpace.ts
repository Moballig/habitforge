import { netKcalRange } from "./mets";

export type NoiseLevel = "silent" | "ultra_low" | "low";

export interface SmallSpaceExercise {
  nameEn: string;
  nameBn: string;
  repsOrTimeEn: string;
  repsOrTimeBn: string;
  tipEn: string;
  tipBn: string;
}

export interface SmallSpaceRoutine {
  id: "rooftop_pacing" | "low_noise_bodyweight" | "balcony_mobility" | "corridor_intervals";
  titleEn: string;
  titleBn: string;
  locationEn: string;
  locationBn: string;
  durationMin: number;
  met: number;
  spaceRequiredEn: string;
  spaceRequiredBn: string;
  noiseLevel: NoiseLevel;
  activityType: "walk" | "home" | "yoga";
  descriptionEn: string;
  descriptionBn: string;
  exercises: SmallSpaceExercise[];
}

export const SMALL_SPACE_ROUTINES: SmallSpaceRoutine[] = [
  {
    id: "rooftop_pacing",
    titleEn: "Rooftop Brisk Walk",
    titleBn: "ছাদে সতেজ হাঁটা",
    locationEn: "Building Rooftop (ছাদ)",
    locationBn: "বিল্ডিংয়ের ছাদ",
    durationMin: 25,
    met: 4.0,
    spaceRequiredEn: "Open rooftop pathway",
    spaceRequiredBn: "ছাদের উন্মুক্ত হাঁটার পথ",
    noiseLevel: "low",
    activityType: "walk",
    descriptionEn: "Brisk continuous pacing on the apartment roof above street noise and vehicle fumes.",
    descriptionBn: "রাস্তার ধুলাবালি ও ট্রাফিকের উপরে অ্যাপার্টমেন্টের ছাদে সতেজ মুক্ত বাতাসে হাঁটা।",
    exercises: [
      {
        nameEn: "Steady Pacing with Arm Swings",
        nameBn: "হাত দুলিয়ে ছন্দময় হাঁটা",
        repsOrTimeEn: "15 mins",
        repsOrTimeBn: "১৫ মিনিট",
        tipEn: "Keep eyes ahead, breathe steadily through nose.",
        tipBn: "সামনে দৃষ্টি রাখুন, নাক দিয়ে স্বাভাবিক শ্বাস নিন।",
      },
      {
        nameEn: "Brisk Interval Laps",
        nameBn: "দ্রুতগতির ল্যাপ",
        repsOrTimeEn: "10 mins",
        repsOrTimeBn: "১০ মিনিট",
        tipEn: "Accelerate speed for 2 laps, normal pace for 1 lap.",
        tipBn: "২ ল্যাপ কিছুটা দ্রুত, এরপর ১ ল্যাপ স্বাভাবিক গতিতে।",
      },
    ],
  },
  {
    id: "low_noise_bodyweight",
    titleEn: "Quiet Apartment Bodyweight",
    titleBn: "শব্দহীন অ্যাপার্টমেন্ট শরীরচর্চা",
    locationEn: "Bedroom or Living Room Rug",
    locationBn: "বেডরুম বা ড্রয়িংরুমের কার্পেট/ম্যাট",
    durationMin: 20,
    met: 3.8,
    spaceRequiredEn: "2 × 2 meters (single mat size)",
    spaceRequiredBn: "২ × ২ মিটার (একটি জায়নামাজ বা ম্যাট)",
    noiseLevel: "ultra_low",
    activityType: "home",
    descriptionEn: "Zero jumping or foot impact on concrete floor. Safe for downstairs neighbors.",
    descriptionBn: "নিচের তলার প্রতিবেশীদের বিরক্তি না ঘটিয়ে কোনো প্রকার লাফঝাঁপ ছাড়া শান্ত বডিওয়েট এক্সারসাইজ।",
    exercises: [
      {
        nameEn: "Tempo Air Squats (Slow Descent)",
        nameBn: "ধীরগতির স্কোয়াট",
        repsOrTimeEn: "3 sets × 12 reps",
        repsOrTimeBn: "৩ সেট × ১২ বার",
        tipEn: "3 seconds down, 1 second up. Heels flat on floor.",
        tipBn: "৩ সেকেন্ড সময় নিয়ে বসুন, ১ সেকেন্ডে উঠুন। গোড়ালি মাটিতে রাখুন।",
      },
      {
        nameEn: "Incline Pushups (On Bed/Sofa)",
        nameBn: "ইনক্লাইন পুশআপ (খাটের কোণে বা সোফায়)",
        repsOrTimeEn: "3 sets × 10 reps",
        repsOrTimeBn: "৩ সেট × ১০ বার",
        tipEn: "Hands on firm edge, keep core tight without arching back.",
        tipBn: "হাত খাটের শক্ত কোণায় রাখুন, কোমর সোজা রাখুন।",
      },
      {
        nameEn: "Glute Bridges",
        nameBn: "গ্লুট ব্রিজ",
        repsOrTimeEn: "3 sets × 15 reps",
        repsOrTimeBn: "৩ সেট × ১৫ বার",
        tipEn: "Squeeze glutes at top, pause for 1 second before lowering.",
        tipBn: "উপরে ওঠার পর ১ সেকেন্ড ধরে রাখুন, এরপর ধীরে নামুন।",
      },
      {
        nameEn: "Standing Calf Raises",
        nameBn: "দাঁড়িয়ে কাফ রেইজ",
        repsOrTimeEn: "3 sets × 20 reps",
        repsOrTimeBn: "৩ সেট × ২০ বার",
        tipEn: "Raise onto toes smoothly, hold wall for balance.",
        tipBn: "পায়ের পাতার ওপর ভর দিয়ে সোজা উঠুন।",
      },
    ],
  },
  {
    id: "balcony_mobility",
    titleEn: "Balcony Mobility & Posture",
    titleBn: "বারান্দায় স্ট্রেচিং ও ভঙ্গি সংশোধন",
    locationEn: "Balcony or Open Window",
    locationBn: "বারান্দা বা খোলা জানালার কাছে",
    durationMin: 15,
    met: 2.5,
    spaceRequiredEn: "1 × 2 meters",
    spaceRequiredBn: "১ × ২ মিটার",
    noiseLevel: "silent",
    activityType: "yoga",
    descriptionEn: "Gentle mobility and deep breathing to release desk tension and posture stiffness.",
    descriptionBn: "দিনের ক্লান্তি ও পিঠের শক্তভাব দূর করতে বারান্দার বাতাসে হালকা স্ট্রেচিং ও গভীর শ্বাস।",
    exercises: [
      {
        nameEn: "Balcony Railing Chest Opener",
        nameBn: "বারান্দার গ্রিল ধরে বুক প্রসারিত করা",
        repsOrTimeEn: "10 deep breaths",
        repsOrTimeBn: "১০ বার গভীর শ্বাস",
        tipEn: "Hold railing lightly, step back and let chest drop gently.",
        tipBn: "রেইলিং ধরে পেছনে পা দিয়ে বুক আলতো করে নামান।",
      },
      {
        nameEn: "Standing Torso Twist",
        nameBn: "দাঁড়িয়ে ধড় ঘোরানো",
        repsOrTimeEn: "15 reps per side",
        repsOrTimeBn: "প্রতি পাশে ১৫ বার",
        tipEn: "Rotate gently from torso, keep hips facing forward.",
        tipBn: "ধীরে ধীরে কোমরের ওপরের অংশ দুই পাশে ঘোরান।",
      },
      {
        nameEn: "Neck and Shoulder Release",
        nameBn: "ঘাড় ও কাঁধের স্ট্রেচ",
        repsOrTimeEn: "3 mins",
        repsOrTimeBn: "৩ মিনিট",
        tipEn: "Slow semicircular rolls without forcing range.",
        tipBn: "আলতো করে কাঁধ পেছনে ঘোরান এবং ঘাড় স্ট্রেচ করুন।",
      },
    ],
  },
  {
    id: "corridor_intervals",
    titleEn: "Apartment Hallway Pacing",
    titleBn: "অ্যাপার্টমেন্টের করিডোরে হাঁটা",
    locationEn: "Apartment Corridor or Living Room",
    locationBn: "ঘরের করিডোর বা লিভিং রুমের পথ",
    durationMin: 20,
    met: 3.5,
    spaceRequiredEn: "Straight hallway or circular room loop",
    spaceRequiredBn: "সোজা করিডোর বা ঘরের চতুর্দিক",
    noiseLevel: "silent",
    activityType: "walk",
    descriptionEn: "Continuous, calm indoor walking while listening to audio or during power outages.",
    descriptionBn: "ঘরের ভেতরে শান্ত পদচারণা। লোডশেডিং বা বৈরী আবহাওয়ায় দারুণ উপযোগী।",
    exercises: [
      {
        nameEn: "Silent Hallway Laps",
        nameBn: "শব্দহীন পদচারণা",
        repsOrTimeEn: "15 mins",
        repsOrTimeBn: "১৫ মিনিট",
        tipEn: "Wear soft socks or bare feet, walk in smooth continuous loops.",
        tipBn: "খালি পায়ে বা নরম মোজা পরে অবিরাম গতিতে হাঁটুন।",
      },
      {
        nameEn: "Controlled High Knees (No Thumping)",
        nameBn: "নিয়ন্ত্রিত হাই নিজ (শব্দ ছাড়া)",
        repsOrTimeEn: "5 mins",
        repsOrTimeBn: "৫ মিনিট",
        tipEn: "Lift knee to hip level with control, land gently on toes.",
        tipBn: "ধীরে হাঁটু ওপরে তুলুন এবং আলতো করে নামান।",
      },
    ],
  },
];

export function getSmallSpaceRoutineKcal(
  routine: SmallSpaceRoutine,
  weightKg: number = 65,
): { low: number; high: number } {
  return netKcalRange(routine.met, weightKg, routine.durationMin);
}

