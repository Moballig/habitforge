/**
 * Wave 6: Family & caregiver mode (FR-G-06).
 * One shared menu, per-person portions — deterministic, no LLM.
 */
import { CONDITION_PLATE_PRESETS } from "./conditionPlates";

export type FamilyRelation = "child" | "teen" | "adult" | "elder";
export type FamilyCondition = "diabetes" | "hypertension";

export interface FamilyMember {
  id: string;
  name: string;
  relation: FamilyRelation;
  condition?: FamilyCondition;
}

/** Energy-need multiplier vs the adult base (conservative, non-clinical defaults). */
export const RELATION_FACTOR: Record<FamilyRelation, number> = {
  child: 0.5,
  teen: 0.75,
  adult: 1,
  elder: 0.8,
};

export const RELATION_LABELS: Record<FamilyRelation, { en: string; bn: string }> = {
  child: { en: "Child (4–12)", bn: "শিশু (৪–১২)" },
  teen: { en: "Teen (13–17)", bn: "কিশোর (১৩–১৭)" },
  adult: { en: "Adult", bn: "প্রাপ্তবয়স্ক" },
  elder: { en: "Elder (60+)", bn: "বয়স্ক (৬০+)" },
};

export interface FamilyMenuDish {
  slot: "breakfast" | "lunch" | "dinner";
  nameEn: string;
  nameBn: string;
  share: number;
}

/** The single shared menu the whole family eats from. */
export const FAMILY_MENU: FamilyMenuDish[] = [
  { slot: "breakfast", nameEn: "Khichuri with egg & shak", nameBn: "খিচুড়ি, ডিম ও শাক", share: 0.25 },
  { slot: "lunch", nameEn: "Rice, dal, small fish & vegetables", nameBn: "ভাত, ডাল, ছোট মাছ ও সবজি", share: 0.4 },
  { slot: "dinner", nameEn: "Rice, dal & egg curry", nameBn: "ভাত, ডাল ও ডিমের তরকারি", share: 0.35 },
];

export interface FamilyMemberPortions extends FamilyMember {
  factor: number;
  kcal: number;
  riceBati: number;
  proteinServings: number;
  doctorNote?: string;
}

/** Per-person portions for a daily kcal budget (grain share ÷ 260 kcal/bati, protein ÷ 150 kcal/serving). */
export function portionsForKcal(baseKcal: number, member: FamilyMember): FamilyMemberPortions {
  const factor = RELATION_FACTOR[member.relation];
  const kcal = Math.max(800, Math.round(baseKcal * factor));
  const riceBati = Math.max(0.5, Math.round(((kcal * 0.35) / 260) * 2) / 2);
  const proteinServings = Math.max(1, Math.round((kcal * 0.25) / 150));
  const doctorNote = member.condition
    ? CONDITION_PLATE_PRESETS[member.condition].clinicalDisclaimer
    : undefined;
  return { ...member, factor, kcal, riceBati, proteinServings, doctorNote };
}

/**
 * FR-G-06 gate: family mode produces ONE menu with per-person portions.
 * The menu is shared; only the portions differ per member.
 */
export function buildFamilyMenu(
  baseKcal: number,
  members: FamilyMember[],
): { menu: FamilyMenuDish[]; portions: FamilyMemberPortions[] } {
  return {
    menu: FAMILY_MENU,
    portions: members.map((m) => portionsForKcal(baseKcal, m)),
  };
}
