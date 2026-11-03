"use client";

import { useState, useSyncExternalStore } from "react";
import { useMutation, useQuery } from "convex/react";
import { UserPlus, Users, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { api } from "../../../../convex/_generated/api";
import { todayISO } from "@/lib/foods/search";
import {
  buildFamilyMenu,
  RELATION_LABELS,
  type FamilyCondition,
  type FamilyMember,
  type FamilyRelation,
} from "@/lib/engine/family";
import { Button, PillInput, Select } from "@/components/forms/Forms";
import { Chip, SectionLabel } from "@/components/data/Primitives";
import { NoticeCard } from "@/components/shell/Banners";
import Link from "next/link";

const RELATIONS: FamilyRelation[] = ["child", "teen", "adult", "elder"];

export default function FamilyPage() {
  const { t, lang } = useI18n();
  // Client-only date; server snapshot is "" so prerender never calls new Date()
  const today = useSyncExternalStore(
    () => () => {},
    () => todayISO(),
    () => "",
  );
  const profile = useQuery(api.profile.get, {});
  const budget = useQuery(api.budget.get, today ? { today } : "skip");
  const saveMembers = useMutation(api.profile.saveFamilyMembers);

  const [name, setName] = useState("");
  const [relation, setRelation] = useState<FamilyRelation>("child");
  const [condition, setCondition] = useState<"" | FamilyCondition>("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (profile === undefined || budget === undefined) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-extrabold md:text-3xl">
          {lang === "bn" ? "পারিবারিক মেনু" : "Family menu"}
        </h1>
        <div className="tile h-40 animate-pulse" aria-busy="true" aria-label="Loading" />
      </div>
    );
  }

  if (profile === null || budget === null) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-extrabold md:text-3xl">
          {lang === "bn" ? "পারিবারিক মেনু" : "Family menu"}
        </h1>
        <NoticeCard
          tone="info"
          title={t("states.empty")}
          body={lang === "bn" ? "আপনার প্রোফাইল সেট করুন।" : "Set up your profile first."}
        />
        <Link href="/onboarding">
          <Button>{t("home.setup")}</Button>
        </Link>
      </div>
    );
  }

  const members: FamilyMember[] = profile.familyMembers ?? [];
  const baseKcal = budget.dailyTargetKcal;
  const you: FamilyMember = { id: "me", name: lang === "bn" ? "আপনি" : "You", relation: "adult" };
  const { menu, portions } = buildFamilyMenu(baseKcal, [you, ...members]);

  async function persist(next: FamilyMember[]) {
    setSaving(true);
    setError(null);
    try {
      await saveMembers({ members: next });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  async function addMember() {
    const trimmed = name.trim();
    if (!trimmed || saving) return;
    await persist([
      ...members,
      { id: crypto.randomUUID(), name: trimmed, relation, condition: condition || undefined },
    ]);
    setName("");
    setCondition("");
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold md:text-3xl">
          {lang === "bn" ? "পারিবারিক মেনু" : "Family menu"}
        </h1>
        <p className="mt-1 text-sm text-ink/55">
          {lang === "bn"
            ? "একটি মেনু — প্রত্যেকের নিজের অংশ পান। শিশু, কিশোর ও বয়স্কদের জন্য আলাদা হিসাব।"
            : "One menu the whole house cooks — each person gets their own portion."}
        </p>
      </header>

      {/* ONE shared menu */}
      <section className="space-y-3">
        <SectionLabel>
          <span className="flex items-center gap-1.5">
            <Users size={14} aria-hidden />
            {lang === "bn" ? "আজকের একটি মেনু" : "One menu for today"}
          </span>
        </SectionLabel>
        <div className="card divide-y divide-border p-0 overflow-hidden">
          {menu.map((dish) => (
            <div key={dish.slot} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-bold">{lang === "bn" ? dish.nameBn : dish.nameEn}</p>
                <p className="text-xs text-ink/50 capitalize">{dish.slot}</p>
              </div>
              <span className="font-num shrink-0 rounded-full bg-violet/10 px-2.5 py-1 text-xs font-extrabold text-violet">
                {Math.round(baseKcal * dish.share)} kcal
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Per-person portions */}
      <section className="space-y-3">
        <SectionLabel>
          {lang === "bn" ? "ব্যক্তিগত অংশ" : "Per-person portions"}
        </SectionLabel>
        <div className="space-y-3">
          {portions.map((p) => (
            <div key={p.id} className="card space-y-2 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold">{p.name}</span>
                  <span className="rounded-full bg-surface-soft px-2 py-0.5 text-[11px] font-bold text-ink/60">
                    {RELATION_LABELS[p.relation][lang === "bn" ? "bn" : "en"]}
                  </span>
                  {p.condition && (
                    <span className="rounded-full bg-peach px-2 py-0.5 text-[11px] font-bold text-peach-ink">
                      {p.condition === "diabetes"
                        ? lang === "bn" ? "ডায়াবেটিস" : "Diabetes-friendly"
                        : lang === "bn" ? "উচ্চ রক্তচাপ" : "Hypertension-friendly"}
                    </span>
                  )}
                </div>
                {p.id !== "me" && (
                  <button
                    type="button"
                    aria-label={`${lang === "bn" ? "সরান" : "Remove"} ${p.name}`}
                    onClick={() => void persist(members.filter((m) => m.id !== p.id))}
                    disabled={saving}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-ink/50 hover:text-ink disabled:opacity-40"
                  >
                    <X size={15} aria-hidden />
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-bold">
                <span className="rounded-full bg-mint px-2.5 py-1 text-mint-ink font-num">
                  {p.kcal} kcal
                </span>
                <span className="rounded-full bg-violet/10 px-2.5 py-1 text-violet font-num">
                  {p.riceBati} {lang === "bn" ? "বাটি ভাত" : "bati rice"}
                </span>
                <span className="rounded-full bg-blue/10 px-2.5 py-1 text-blue font-num">
                  {p.proteinServings}×{" "}
                  {lang === "bn" ? "প্রোটিন" : "protein serving"}
                </span>
              </div>
              {p.doctorNote && (
                <NoticeCard
                  tone="info"
                  title={lang === "bn" ? "ডাক্তারের কথা" : "Doctor note"}
                  body={p.doctorNote}
                />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Add member */}
      <section className="card space-y-4 p-5">
        <SectionLabel>
          <span className="flex items-center gap-1.5">
            <UserPlus size={14} aria-hidden />
            {lang === "bn" ? "সদস্য যোগ করুন" : "Add a family member"}
          </span>
        </SectionLabel>
        <PillInput
          id="member-name"
          label={lang === "bn" ? "নাম" : "Name"}
          placeholder={lang === "bn" ? "যেমন: রহিম" : "e.g. Rahim"}
          value={name}
          onChange={setName}
        />
        <div>
          <p className="mb-1.5 text-sm font-medium text-ink/55">
            {lang === "bn" ? "সম্পর্ক" : "Relation"}
          </p>
          <div className="flex flex-wrap gap-2">
            {RELATIONS.map((r) => (
              <Chip key={r} selected={relation === r} onClick={() => setRelation(r)}>
                {RELATION_LABELS[r][lang === "bn" ? "bn" : "en"]}
              </Chip>
            ))}
          </div>
        </div>
        <Select
          label={lang === "bn" ? "শারীরিক অবস্থা (ঐচ্ছিক)" : "Health condition (optional)"}
          id="member-condition"
          value={condition}
          onChange={(v) => setCondition(v as "" | FamilyCondition)}
          options={[
            { value: "", label: lang === "bn" ? "নেই" : "None" },
            { value: "diabetes", label: lang === "bn" ? "ডায়াবেটিস" : "Diabetes" },
            { value: "hypertension", label: lang === "bn" ? "উচ্চ রক্তচাপ" : "Hypertension" },
          ]}
        />
        {error && <NoticeCard tone="error" title="Could not save" body={error} />}
        <Button full disabled={saving || !name.trim()} onClick={() => void addMember()}>
          {saved
            ? `✓ ${t("states.saved")}`
            : saving
              ? "Saving…"
              : lang === "bn" ? "যোগ করুন" : "Add member"}
        </Button>
      </section>

      <NoticeCard
        tone="gentle"
        title={lang === "bn" ? "সহজ হিসাব, বিচারহীন" : "Easy estimates, no judgement"}
        body={
          lang === "bn"
            ? "অংশগুলো পরিকল্পনার জন্য আনুমানিক — ওজন বা সাদা চিনির কোনো তালিকা নেই। স্বাস্থ্যসংক্রান্ত সদস্যের জন্য ডাক্তারের পরামর্শ আগে।"
            : "Portions are planning estimates — no weight lists, no sugar shaming. For members with a condition, check with their doctor first."
        }
      />
    </div>
  );
}
