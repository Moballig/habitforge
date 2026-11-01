/**
 * Wave 1 seed: 150 Deshi food staples with source tags.
 * Values are demo-grade placeholders aligned to FCTB-style ranges —
 * D1/D2 replace kcal/macros from the FAO FCTB Excel and hand-verify 150 rows.
 * Every row MUST carry sourceTag (gate: visible source tags).
 */
import type { SourceTag } from "../types";

export type SeedFood = {
  nameBn: string;
  nameEn: string;
  aliases: string[];
  kcalPer100: number;
  proteinPer100: number;
  carbPer100: number;
  fatPer100: number;
  fiberPer100?: number;
  measures: { label: string; grams: number }[];
  sourceTag: SourceTag;
  isCooked: boolean;
  rangeLow?: number;
  rangeHigh?: number;
  regionTags?: string[];
};

const bati = [
  { label: "bati small", grams: 150 },
  { label: "bati medium", grams: 200 },
  { label: "bati large", grams: 300 },
];
const bowl = [
  { label: "bowl", grams: 150 },
  { label: "serving spoon", grams: 50 },
];
const piece = [{ label: "piece", grams: 50 }];
const portion = [{ label: "portion", grams: 80 }];
const cup = [{ label: "cup", grams: 150 }];

function f(
  nameBn: string,
  nameEn: string,
  aliases: string[],
  kcal: number,
  p: number,
  c: number,
  fat: number,
  sourceTag: SourceTag,
  isCooked: boolean,
  measures: { label: string; grams: number }[],
  extra: Partial<SeedFood> = {},
): SeedFood {
  return {
    nameBn,
    nameEn,
    aliases,
    kcalPer100: kcal,
    proteinPer100: p,
    carbPer100: c,
    fatPer100: fat,
    measures,
    sourceTag,
    isCooked,
    ...extra,
  };
}

const R = (mid: number): { rangeLow: number; rangeHigh: number } => ({
  rangeLow: Math.round(mid * 0.85),
  rangeHigh: Math.round(mid * 1.15),
});

/** 150 rows — staples, curries, bhorta, snacks, drinks, street. */
export const FOOD_SEED: SeedFood[] = [
  // —— Grains & starches (1–20) ——
  f("ভাত", "Steamed rice", ["bhat", "chal", "rice"], 130, 2.7, 28, 0.3, "estimated-recipe", true, bati, { ...R(130), regionTags: ["national"] }),
  f("আটার রুটি", "Wheat flatbread", ["ruti", "roti", "chapati"], 264, 8, 55, 2, "estimated-recipe", true, [{ label: "piece", grams: 40 }], R(264)),
  f("পরোটা", "Paratha", ["porota", "parata"], 330, 7, 45, 13, "estimated-recipe", true, [{ label: "piece", grams: 60 }], R(330)),
  f("খিচুড়ি", "Khichuri", ["khichuri", "khichdi"], 160, 5, 24, 4, "estimated-recipe", true, bati, R(160)),
  f("পোলাও", "Polao rice", ["pulao", "pilaf"], 190, 4, 30, 5, "estimated-recipe", true, bati, R(190)),
  f("মুড়ি", "Puffed rice", ["muri", "muri choraa"], 380, 8, 78, 1, "fctb", false, [{ label: "cup", grams: 30 }]),
  f("চিড়া", "Flattened rice", ["chira", "chivda"], 350, 7, 74, 1, "fctb", false, [{ label: "cup", grams: 40 }]),
  f("সুজি", "Semolina", ["suji", "sooji"], 360, 12, 73, 1, "fctb", false, [{ label: "cup", grams: 100 }]),
  f("চাল (কাচ্চি)", "Kacchi rice (raw portion)", ["kacchi rice"], 350, 7, 72, 5, "estimated", true, bati),
  f("লাল চাল", "Red rice", ["lal chal", "red rice"], 350, 8, 72, 1, "fctb", false, bati),
  f("আটা", "Wheat flour", ["ata", "flour"], 364, 13, 76, 1.5, "fctb", false, [{ label: "cup", grams: 120 }]),
  f("ময়দা", "Refined flour", ["maida"], 364, 10, 76, 1, "fctb", false, [{ label: "cup", grams: 120 }]),
  f("চালের গুঁড়ো", "Rice flour", ["chaler guri"], 366, 6, 80, 1, "fctb", false, [{ label: "cup", grams: 100 }]),
  f("আলু", "Potato", ["alu", "aloo"], 77, 2, 17, 0.1, "fctb", true, [{ label: "medium", grams: 150 }]),
  f("মিষ্টি আলু", "Sweet potato", ["mishti alu"], 86, 1.6, 20, 0.1, "fctb", true, [{ label: "medium", grams: 130 }]),
  f("কচু", "Taro", ["kochu"], 112, 1.5, 26, 0.2, "fctb", true, portion),
  f("চালের পিঠা", "Rice cake (pitha)", ["pitha", "chitoi pitha"], 180, 4, 38, 1, "estimated-recipe", true, [{ label: "piece", grams: 70 }]),
  f("ভাপা পিঠা", "Steamed pitha", ["bhapa pitha"], 170, 3, 36, 1, "estimated-recipe", true, [{ label: "piece", grams: 80 }]),
  f("লাচ্ছি", "Sticky rice pitha", ["lachi pitha"], 220, 4, 45, 3, "estimated-recipe", true, [{ label: "piece", grams: 70 }]),
  f("চালের টিকিয়া", "Rice tikia", ["tikia"], 250, 6, 40, 7, "estimated-recipe", true, [{ label: "piece", grams: 50 }]),

  // —— Pulses / dal (21–35) ——
  f("মুসুর ডাল", "Masoor dal", ["masoor", "red lentil"], 320, 24, 55, 1, "fctb", false, bowl),
  f("মুগ ডাল", "Moong dal", ["moong", "mung"], 345, 24, 63, 1, "fctb", false, bowl),
  f("চানা ডাল", "Chana dal", ["chana", "bengal gram"], 360, 22, 63, 1, "fctb", false, bowl),
  f("অরহর ডাল", "Arhar/toor dal", ["toor", "pigeon pea"], 340, 22, 63, 1, "fctb", false, bowl),
  f("রাজমা", "Kidney beans", ["rajma"], 340, 23, 60, 1, "fctb", false, bowl),
  f("ছোলা", "Chickpeas", ["chola", "chana"], 378, 20, 60, 6, "fctb", false, bowl),
  f("ডাল ভাজা", "Fried dal mix", ["dal bhaja"], 380, 18, 50, 12, "estimated-recipe", true, bowl),
  f("সরিষার ডাল", "Mustard dal", ["shorshe dal"], 200, 8, 18, 10, "estimated-recipe", true, bowl),
  f("কাঁচা মুগ", "Green gram whole", ["kancha moong"], 348, 24, 62, 1, "fctb", false, bowl),
  f("বটমস", "Bottle bean", ["bot motors"], 130, 8, 22, 1, "fctb", true, portion),
  f("ডাল স্টিক", "Dal stick snack", ["dal stick"], 420, 15, 60, 14, "estimated", false, [{ label: "piece", grams: 30 }]),
  f("ইডলি ডাল ব্যাটার", "Idli batter", ["idli"], 130, 4, 26, 1, "estimated", true, cup),
  f("মাষকলাই ডাল", "Urad dal", ["urad", "maashkalai"], 340, 25, 60, 1, "fctb", false, bowl),
  f("ডাল (রান্না)", "Cooked dal", ["dal", "dhal"], 115, 6, 16, 3, "estimated-recipe", true, bowl, R(115)),
  f("বাটি ডাল", "Thick dal", ["bati dal"], 140, 7, 18, 4, "estimated-recipe", true, bowl),

  // —— Fish & seafood (36–55) ——
  f("ইলিশ", "Hilsa", ["ilish", "hilsa"], 230, 22, 0, 15, "fctb", true, [{ label: "piece", grams: 100 }], R(230)),
  f("রুই", "Rui fish", ["rui", "rohu"], 140, 20, 0, 6, "fctb", true, [{ label: "piece", grams: 100 }]),
  f("কাতলা", "Katla", ["catla"], 145, 21, 0, 6, "fctb", true, [{ label: "piece", grams: 120 }]),
  f("পাবদা", "Pabda", ["pabda"], 130, 19, 0, 5, "fctb", true, [{ label: "piece", grams: 80 }]),
  f("তেলাপিয়া", "Tilapia", ["telapia", "tilapia"], 128, 20, 0, 4, "fctb", true, [{ label: "piece", grams: 100 }]),
  f("মাছ ভাজা", "Fried fish", ["mach bhaja", "fish fry"], 250, 22, 5, 15, "estimated-recipe", true, [{ label: "piece", grams: 100 }], R(250)),
  f("মাছ তেলে", "Fish in mustard sauce", ["shorshe mach"], 180, 18, 3, 11, "estimated-recipe", true, [{ label: "piece", grams: 120 }]),
  f("চিংড়ি", "Shrimp", ["chingri", "prawn"], 99, 24, 2, 0.3, "fctb", true, [{ label: "piece", grams: 30 }]),
  f("চিংড়ি মালাইকারি", "Prawn malaikari", ["chingri malaikari"], 160, 15, 5, 9, "estimated-recipe", true, portion),
  f("কাঁকড়া", "Crab", ["kankra"], 97, 19, 0, 1, "fctb", true, portion),
  f("ঝিংগে", "Dried fish small", ["jinge", "shutki"], 250, 45, 5, 8, "fctb", false, portion),
  f("শুঁটকি ভাজা", "Fried dried fish", ["shutki bhaja"], 320, 42, 4, 15, "estimated-recipe", true, portion),
  f("মাছের তেল", "Fish oil bit (curry)", ["macher tel"], 200, 10, 4, 17, "estimated", true, portion),
  f("সিলভার কার্প", "Silver carp", ["carp", "silver carp"], 120, 18, 0, 4, "fctb", true, [{ label: "piece", grams: 100 }]),
  f("মৃগেল", "Mrigel fish", ["mrigel"], 125, 19, 0, 4, "fctb", true, [{ label: "piece", grams: 100 }]),
  f("বাম (শিং)", "Dried shrimp", ["bham", "shing"], 300, 50, 5, 8, "fctb", false, portion),
  f("ফাইল মাছ", "Featherback", ["feather fish"], 135, 20, 0, 5, "fctb", true, [{ label: "piece", grams: 100 }]),
  f("কই", "Koi fish", ["koi"], 130, 19, 0, 5, "fctb", true, [{ label: "piece", grams: 90 }]),
  f("বাঁশ", "Bamboo shoot (pickle)", ["bansh"], 40, 3, 7, 0, "fctb", true, portion),
  f("ইলিশ ভাজা", "Fried hilsa", ["ilish bhaja"], 280, 22, 2, 19, "estimated-recipe", true, [{ label: "piece", grams: 100 }]),
  f("মাছের ডাম্পলিং", "Fish dumpling", ["mach er shingara"], 220, 12, 25, 8, "estimated-recipe", true, [{ label: "piece", grams: 55 }]),

  // —— Meat & eggs (56–75) ——
  f("মুরগি (রান্না)", "Chicken cooked", ["murgi", "chicken"], 190, 26, 0, 9, "fctb", true, [{ label: "piece", grams: 100 }]),
  f("মুরগির রান্না (কারি)", "Chicken curry", ["chicken curry", "murgir jhol"], 170, 22, 4, 8, "estimated-recipe", true, portion, R(170)),
  f("মুরগির স্তন", "Chicken breast", ["chicken breast"], 165, 31, 0, 3.6, "fctb", true, [{ label: "piece", grams: 120 }]),
  f("খাসির মাংস", "Pork", ["khashi", "pork"], 240, 25, 0, 15, "fctb", true, portion),
  f("গরুর মাংস", "Beef", ["gorur mangsho", "beef"], 250, 26, 0, 15, "fctb", true, portion),
  f("গরুর কারি", "Beef curry", ["beef curry"], 230, 24, 5, 13, "estimated-recipe", true, portion, R(230)),
  f("কাচ্চি বিরিয়ানি (মুরগি)", "Chicken biriyani", ["biryani", "biriyani"], 190, 8, 26, 6, "estimated", true, [{ label: "plate", grams: 350 }], R(190)),
  f("কাচ্চি (গরু)", "Beef kacchi", ["kacchi"], 210, 10, 28, 7, "estimated", true, [{ label: "plate", grams: 350 }], R(210)),
  f("তেহারি", "Tehari", ["tehari"], 185, 7, 28, 5, "estimated-recipe", true, bati, R(185)),
  f("রোস্ট মুরগি", "Roast chicken", ["roast murgi"], 220, 24, 4, 12, "estimated-recipe", true, portion),
  f("কোয়া", "Kebab (koora)", ["kebab", "koora"], 250, 22, 8, 14, "estimated-recipe", true, [{ label: "piece", grams: 60 }]),
  f("কাবাব", "Shami kebab", ["shami"], 240, 18, 12, 13, "estimated-recipe", true, [{ label: "piece", grams: 55 }]),
  f("ডিম (সেদা)", "Boiled egg", ["dim", "egg"], 155, 13, 1.1, 11, "fctb", true, piece),
  f("ডিম ভাজা", "Fried egg", ["dim bhaja", "egg fry"], 190, 13, 1, 15, "estimated-recipe", true, piece),
  f("ডিমের কারি", "Egg curry", ["dim er jhol"], 160, 10, 6, 11, "estimated-recipe", true, portion),
  f("অমলেট", "Omelette", ["omelet", "omlet"], 195, 12, 2, 15, "estimated-recipe", true, [{ label: "piece", grams: 80 }]),
  f("ডিম ভুনা", "Egg bhurji", ["dim bhuna"], 175, 12, 4, 12, "estimated-recipe", true, portion),
  f("মুরগির খিচুড়ি", "Chicken khichuri", ["murgi khichuri"], 175, 8, 24, 5, "estimated-recipe", true, bati),
  f("মাটির ডিম ভাজা", "Duck egg fry", ["matir dim"], 200, 14, 2, 15, "estimated", true, piece),
  f("মুরগির পাঁপড়ি", "Chicken papdi", ["papdi"], 350, 18, 30, 16, "estimated", true, [{ label: "piece", grams: 40 }]),

  // —— Vegetables (76–100) ——
  f("পটল", "Pointed gourd", ["potol"], 33, 1, 7, 0.1, "fctb", true, portion),
  f("ঝিঙে", "Ridge gourd", ["jinge veg"], 25, 1, 5, 0.1, "fctb", true, portion),
  f("করলা", "Bitter gourd", ["korola", "karela"], 24, 1, 5, 0.2, "fctb", true, portion),
  f("লাউ", "Bottle gourd", ["lau"], 15, 0.7, 3.5, 0.1, "fctb", true, portion),
  f("চালকুমড়া", "Ash gourd", ["chalkumra"], 13, 0.4, 3, 0.1, "fctb", true, portion),
  f("ডাঁটা", "Drumstick", ["danta", "sahjan"], 64, 3, 12, 0.1, "fctb", true, portion),
  f("বেগুন", "Eggplant", ["begun", "brinjal"], 25, 1, 6, 0.2, "fctb", true, portion),
  f("বেগুন ভাজা", "Fried eggplant", ["begun bhaja"], 140, 1, 10, 11, "estimated-recipe", true, portion),
  f("কাঁচা কাঁচা", "Raw papaya", ["kacha kacha"], 29, 0.5, 7, 0.1, "fctb", true, portion),
  f("পেঁয়াজ", "Onion", ["peyaj"], 40, 1.1, 9, 0.1, "fctb", true, [{ label: "medium", grams: 80 }]),
  f("পেঁয়াজ কাঁচা", "Raw onion", ["peyaj kacha"], 40, 1, 9, 0.1, "fctb", false, portion),
  f("রসুন", "Garlic", ["roshun"], 149, 6, 33, 0.5, "fctb", false, [{ label: "clove", grams: 3 }]),
  f("আদা", "Ginger", ["ada", "ginger"], 80, 2, 18, 0.7, "fctb", false, [{ label: "inch", grams: 10 }]),
  f("কাঁচামরিচ", "Green chili", ["kacha morich"], 40, 2, 9, 0.2, "fctb", false, [{ label: "piece", grams: 10 }]),
  f("টমেটো", "Tomato", ["tomato"], 18, 0.9, 3.9, 0.2, "fctb", true, [{ label: "medium", grams: 100 }]),
  f("শসা", "Cucumber", ["shosha"], 16, 0.7, 3.6, 0.1, "fctb", false, portion),
  f("গাজর", "Carrot", ["gajor"], 41, 0.9, 10, 0.2, "fctb", true, portion),
  f("মূলা", "Radish", ["mula"], 18, 0.7, 4, 0.1, "fctb", true, portion),
  f("মিষ্টি কুমড়া", "Pumpkin", ["miti kumra"], 26, 1, 6, 0.1, "fctb", true, portion),
  f("ক্যালা (ক্যালা শাক)", "Spinach", ["shak", "palong shak"], 23, 3, 4, 0.4, "fctb", true, portion),
  f("পুঁই শাক", "Amaranth greens", ["pui shak"], 28, 4, 5, 0.5, "fctb", true, portion),
  f("লাল শাক", "Red amaranth", ["lal shak"], 25, 3, 4, 0.4, "fctb", true, portion),
  f("বড়ি", "Dried lentil dumpling", ["bori"], 350, 25, 40, 10, "fctb", true, portion),
  f("ফুলকপি", "Cauliflower", ["phulkopi"], 25, 2, 5, 0.3, "fctb", true, portion),
  f("বাঁধাকপি", "Cabbage", ["bandhakopi", "cabbage"], 25, 1.3, 6, 0.1, "fctb", true, portion),
  f("সজনে ডাঁটা", "Drumstick pod", ["sajne danta"], 70, 4, 12, 1, "fctb", true, portion),
  f("কচুর লতি", "Taro stolon", ["kochu loti"], 45, 2, 9, 0.5, "fctb", true, portion),
  f("ডুমুর (কাঁচা)", "Raw banana", ["kacha kola"], 89, 2, 23, 0.1, "fctb", true, [{ label: "medium", grams: 100 }]),
  f("চালকুমড়ার ভর্তা", "Ash gourd bhorta", ["chalkumra bhorta"], 80, 1, 12, 3, "estimated-recipe", true, portion),
  f("করলার ভর্তা", "Bitter gourd mash", ["korola bhorta"], 70, 2, 10, 2.5, "estimated-recipe", true, portion),
  f("বেগুনের ভর্তা", "Eggplant mash", ["begun bhorta"], 110, 2, 10, 7, "estimated-recipe", true, portion),
  f("আলুর ভর্তা", "Mashed potato", ["alu bhorta", "aloo vorta"], 145, 2, 18, 7, "estimated-recipe", true, portion, R(145)),
  f("ডিমের ভর্তা", "Mashed egg", ["dim bhorta"], 160, 9, 4, 13, "estimated-recipe", true, portion),
  f("পেঁয়াজের ভর্তা", "Onion mash", ["peyaj bhorta"], 90, 1, 12, 4, "estimated-recipe", true, portion),
  f("কাঁচা পেঁয়াজ ভর্তা", "Raw onion bhorta", ["kacha peyaj bhorta"], 70, 1, 10, 3, "estimated-recipe", true, portion),
  f("মুসুর ডাল ভর্তা", "Masoor dal bhorta", ["dal bhorta"], 130, 8, 16, 4, "estimated-recipe", true, portion),
  f("শাক ভাজা", "Fried greens", ["shak bhaja"], 60, 3, 6, 3, "estimated-recipe", true, portion),
  f("মিক্সড ভেজিটেবল", "Mixed vegetable", ["mixed shobji"], 55, 2, 9, 1.5, "estimated-recipe", true, portion),

  // —— Dairy & drinks (101–115) ——
  f("দুধ", "Milk", ["dudh", "milk"], 61, 3.2, 4.8, 3.3, "fctb", true, cup),
  f("চা (দুধ)", "Milk tea", ["cha", "tea"], 60, 2, 8, 2, "estimated", true, cup, R(60)),
  f("কফি", "Coffee", ["coffi", "coffee"], 2, 0.1, 0, 0, "fctb", true, cup),
  f("দই", "Yogurt", ["doi", "curd"], 61, 3.5, 4.7, 3.3, "fctb", true, [{ label: "cup", grams: 150 }]),
  f("লস্যি", "Sweet lassi", ["lassi"], 100, 3, 16, 2, "estimated-recipe", true, cup),
  f("গরম দুধ", "Warm milk", ["gorom dudh"], 65, 3.2, 5, 3.5, "estimated", true, cup),
  f("খাঁটি ঘি", "Ghee", ["ghi", "ghee"], 900, 0, 0, 100, "fctb", false, [{ label: "tbsp", grams: 14 }]),
  f("পানি", "Water", ["pani", "water"], 0, 0, 0, 0, "measured", true, cup),
  f("লেবুর শরবত", "Lemonade", ["lebu sharbat"], 45, 0.2, 11, 0, "estimated", true, cup),
  f("আপেল জুস", "Apple juice", ["apple juice"], 46, 0.1, 11, 0.1, "borrowed", true, cup),
  f("কলা শেক", "Banana shake", ["kola shake"], 90, 2, 16, 2, "estimated-recipe", true, cup),
  f("চিনি", "Sugar", ["chini", "sugar"], 387, 0, 100, 0, "fctb", false, [{ label: "tsp", grams: 4 }]),
  f("মধু", "Honey", ["modhu", "honey"], 304, 0.3, 82, 0, "fctb", false, [{ label: "tbsp", grams: 21 }]),
  f("নোনতা পানি", "Saline ORS water", ["ors"], 0, 0, 0, 0, "user", true, cup),
  f("স্যুপ", "Soup", ["shoup"], 40, 2, 5, 1, "estimated", true, cup),

  // —— Street / snacks (116–140) ——
  f("ফুচকা", "Fuchka", ["fuchka", "panipuri"], 300, 8, 45, 10, "estimated", true, [{ label: "plate6", grams: 180 }], R(300)),
  f("চটপটি", "Chotpoti", ["chotpoti"], 180, 7, 22, 7, "estimated", true, [{ label: "plate", grams: 250 }], R(180)),
  f("ঝালমুড়ি", "Jhal muri", ["jhal muri", "jhalmuri"], 400, 8, 55, 15, "estimated", true, [{ label: "cup", grams: 120 }], R(400)),
  f("সিঙ্গারা", "Samosa/singara", ["singara", "shingara"], 300, 6, 35, 15, "estimated", true, [{ label: "piece", grams: 60 }], R(300)),
  f("পিয়াজু", "Onion fritter", ["piyaju"], 320, 8, 40, 14, "estimated-recipe", true, [{ label: "piece", grams: 55 }]),
  f("বেগুনি", "Eggplant fritter", ["beguni"], 280, 5, 35, 13, "estimated-recipe", true, [{ label: "piece", grams: 50 }]),
  f("বড়া", "Lentil fritter", ["bara", "vada"], 300, 12, 35, 12, "estimated-recipe", true, [{ label: "piece", grams: 50 }]),
  f("ইচড়া", "Spiced chickpea snack", ["chola chat"], 220, 8, 30, 7, "estimated", true, portion),
  f("কাবাব পার৆ল", "Kebab paratha roll", ["kabab roll"], 380, 15, 42, 16, "estimated", true, [{ label: "roll", grams: 180 }], R(380)),
  f("মুরগির রোল", "Chicken roll", ["chicken roll"], 350, 14, 40, 14, "estimated", true, [{ label: "roll", grams: 180 }], R(350)),
  f("বার্গার", "Burger", ["barge"], 290, 12, 32, 13, "borrowed", true, [{ label: "piece", grams: 200 }], R(290)),
  f("পিজ্জা (স্লাইস)", "Pizza slice", ["pizza"], 260, 11, 33, 10, "borrowed", true, [{ label: "slice", grams: 120 }]),
  f("ফ্রেঞ্চ ফ্রাইজ", "French fries", ["fries"], 312, 3.4, 41, 15, "borrowed", true, [{ label: "small pack", grams: 100 }]),
  f("চিকেন নাগেটস", "Chicken nuggets", ["nuggets"], 290, 15, 15, 18, "borrowed", true, [{ label: "piece", grams: 40 }]),
  f("বিস্কুট", "Biscuit", ["biscuit"], 480, 6, 65, 20, "borrowed", false, [{ label: "piece", grams: 15 }]),
  f("কুকিজ", "Cookies", ["cookie"], 500, 5, 65, 24, "borrowed", false, [{ label: "piece", grams: 20 }]),
  f("চকলেট", "Chocolate", ["chocolate"], 540, 5, 60, 31, "borrowed", false, [{ label: "bar", grams: 40 }]),
  f("আইসক্রিম", "Ice cream", ["ice cream"], 200, 3.5, 24, 11, "borrowed", true, [{ label: "scoop", grams: 60 }]),
  f("জিলাপি", "Jilapi", ["jalebi", "jilapi"], 380, 4, 60, 14, "estimated-recipe", true, [{ label: "piece", grams: 45 }]),
  f("রসমালাই", "Rosogolla", ["rasgulla", "roshogolla"], 300, 4, 55, 5, "estimated-recipe", true, [{ label: "piece", grams: 50 }]),
  f("সন্দেশ", "Sandesh", ["sandesh"], 280, 8, 40, 9, "estimated-recipe", true, [{ label: "piece", grams: 40 }]),
  f("বরফি", "Barfi", ["borfi"], 350, 6, 55, 11, "estimated-recipe", true, [{ label: "piece", grams: 35 }]),
  f("হালুয়া", "Halua", ["halwa", "halua"], 320, 5, 45, 12, "estimated-recipe", true, portion),
  f("ফুলি", "Puffed sweet", ["phuli"], 390, 5, 70, 10, "estimated-recipe", true, portion),
  f("খাজা", "Khaja sweet", ["khaja"], 420, 5, 60, 18, "estimated-recipe", true, [{ label: "piece", grams: 40 }]),
  f("বাতাসা", "Batasha", ["batasha"], 390, 1, 97, 0, "estimated-recipe", true, [{ label: "piece", grams: 10 }]),
  f("মুড়কি", "Sweet puffed rice", ["murki"], 380, 5, 75, 7, "estimated-recipe", true, portion),
  f("চালের চিড়া ভাজা", "Fried chira", ["chira bhaja"], 420, 8, 70, 12, "estimated-recipe", true, portion),
  f("গার্লিক ব্রেড", "Garlic bread", ["garlic bread"], 350, 8, 40, 16, "borrowed", true, [{ label: "slice", grams: 40 }]),
  f("স্যান্ডউইচ", "Sandwich", ["sandwich"], 250, 10, 30, 10, "borrowed", true, [{ label: "piece", grams: 120 }]),
  f("ওটস", "Oats", ["oats"], 389, 17, 66, 7, "borrowed", true, [{ label: "serving", grams: 40 }]),
  f("গ্রানোলা", "Granola", ["granola"], 450, 10, 64, 18, "borrowed", false, [{ label: "serving", grams: 50 }]),

  // —— Condiments, oils, extras (141–150) ——
  f("সরিষার তেল", "Mustard oil", ["shorsher tel"], 884, 0, 0, 100, "fctb", false, [{ label: "tbsp", grams: 14 }]),
  f("সয়াবিন তেল", "Soybean oil", ["soybean oil"], 884, 0, 0, 100, "fctb", false, [{ label: "tbsp", grams: 14 }]),
  f("লবণ", "Salt", ["lobon", "salt"], 0, 0, 0, 0, "fctb", false, [{ label: "tsp", grams: 6 }]),
  f("হলুদ", "Turmeric", ["holud", "turmeric"], 354, 8, 65, 3, "fctb", false, [{ label: "tsp", grams: 3 }]),
  f("জিরা", "Cumin", ["jira", "cumin"], 375, 18, 44, 22, "fctb", false, [{ label: "tsp", grams: 2 }]),
  f("মসলা মিক্স (কারি)", "Curry masala mix", ["masala"], 350, 10, 55, 10, "estimated-recipe", false, [{ label: "tbsp", grams: 8 }]),
  f("কাঁচামরিচের সস", "Green chili sauce", ["chili sauce"], 100, 1, 20, 0.5, "borrowed", true, [{ label: "tbsp", grams: 15 }]),
  f("সয়া সস", "Soy sauce", ["soya sauce"], 60, 6, 6, 0, "borrowed", true, [{ label: "tbsp", grams: 15 }]),
  f("টমেটো কেচাপ", "Tomato ketchup", ["ketchup"], 100, 1, 25, 0, "borrowed", true, [{ label: "tbsp", grams: 17 }]),
  f("আচার", "Pickles", ["achar"], 150, 2, 12, 11, "estimated-recipe", true, portion),
];

export const FOOD_SEED_COUNT = FOOD_SEED.length;
