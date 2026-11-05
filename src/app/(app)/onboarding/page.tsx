"use client";

import { useMutation, useQuery, api } from "@/lib/client/api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { Button, Field, SegmentedControl, Select, StepperInput } from "@/components/forms/Forms";
import { SegmentedProgress } from "@/components/data/Charts";
import { SourceTag } from "@/components/data/Primitives";
import { NoticeCard, SafetyBanner } from "@/components/shell/Banners";
import {
  allowsDeficit,
  allowsExerciseCompensation,
  asianBmiBand,
  bmi,
  safetyMode,
  screenFromAnswers,
} from "@/lib/engine";

export default function OnboardingPage() {
  const { t, lang, largeText, setLargeText } = useI18n();
  const router = useRouter();
  const profile = useQuery(api.profile.get, {});
  const saveProfile = useMutation(api.profile.save);
  const [step, setStep] = useState(0);
  const total = 10;
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [age, setAge] = useState(28);
  const [sex, setSex] = useState<"male" | "female">("female");
  const [heightCm, setHeightCm] = useState(160);
  const [weightKg, setWeightKg] = useState(62);
  const [activity, setActivity] = useState("light");
  const [goal, setGoal] = useState("gentle-change");
  const [homeRegion, setHomeRegion] = useState("dhaka");
  const [under18, setUnder18] = useState(false);
  const [pregnancy, setPregnancy] = useState(false);
  const [insulin, setInsulin] = useState(false);
  const [heartKidney, setHeartKidney] = useState(false);
  const [edHistory, setEdHistory] = useState(false);
  const [eatingStyle, setEatingStyle] = useState<string[]>(["rice-heavy"]);
  const [budget, setBudget] = useState(250);
  const [consent, setConsent] = useState(false);

  useEffect(() => {
    if (profile?.homeRegion) {
      setHomeRegion(profile.homeRegion);
    }
    if (profile?.age) setAge(profile.age);
    if (profile?.sex) setSex(profile.sex);
    if (profile?.heightCm) setHeightCm(profile.heightCm);
    if (profile?.weightKg) setWeightKg(profile.weightKg);
    if (profile?.activity) setActivity(profile.activity);
    if (profile?.goal) setGoal(profile.goal);
    if (profile?.budgetBandTaka) setBudget(profile.budgetBandTaka);
    if (profile?.eatingStyle?.length) setEatingStyle(profile.eatingStyle);
  }, [profile]);

  const bmiVal = bmi(weightKg, heightCm);
  const band = asianBmiBand(weightKg, heightCm);
  const screen = screenFromAnswers({
    age,
    weightKg,
    heightCm,
    under18,
    pregnancy,
    insulinOrSulfonylurea: insulin,
    heartOrKidneyDisease: heartKidney,
    eatingDisorderHistory: edHistory,
  });
  // Deterministic engine owns safetyMode — UI only reads it.
  const mode = safetyMode(screen);
  const mayDeficit = allowsDeficit(mode);
  const mayExerciseComp = allowsExerciseCompensation(mode);

  const bmiLabel =
    band === "obese" ? "Above 27.5 — higher risk band (Asian cut-off)" :
    band === "overweight" ? "23–27.5 — watch band (Asian cut-off)" :
    band === "under" ? "Below 18.5 — underweight band" :
    "Below 23 — healthy band (Asian cut-off)";

  async function finish() {
    if (saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      await saveProfile({
        name: undefined,
        age,
        sex,
        heightCm,
        weightKg,
        activity: activity as "sedentary" | "light" | "moderate" | "active",
        goal: goal as "maintain" | "gentle-change" | "build-strength",
        pace: "steady",
        under18,
        pregnancy,
        insulinOrSulfonylurea: insulin,
        heartOrKidneyDisease: heartKidney,
        eatingDisorderHistory: edHistory,
        eatingStyle,
        budgetBandTaka: budget,
        homeRegion,
        consent,
      });
      router.push("/home");
    } catch (e) {
      setSaveError(e instanceof Error ? e.message.slice(0, 200) : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const steps = [
    // 0 language handled by TopBar-like switch; use text size
    {
      title: t("onboarding.langTitle"),
      body: (
        <div className="space-y-4">
          <p className="text-sm text-ink/60">Use the language switch any time. Bangla numerals follow the language.</p>
          <SegmentedControl
            ariaLabel="Text size"
            options={[
              { value: "normal", label: "Normal text" },
              { value: "large", label: "Large text" },
            ]}
            value={largeText ? "large" : "normal"}
            onChange={(v) => setLargeText(v === "large")}
          />
        </div>
      ),
    },
    {
      title: t("onboarding.consentTitle"),
      body: (
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-ink/70">{t("onboarding.consentBody")}</p>
          <label className="flex min-h-11 cursor-pointer items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-1 h-4 w-4 rounded accent-violet"
            />
            <span>I agree and understand</span>
          </label>
        </div>
      ),
    },
    {
      title: t("onboarding.profileTitle"),
      body: (
        <div className="grid gap-4 sm:grid-cols-2">
          <StepperInput label="Age" value={age} unit="yrs" onChange={setAge} min={10} max={90} />
          <div>
            <span className="mb-1.5 block text-sm font-medium text-ink/55">Sex</span>
            <SegmentedControl
              ariaLabel="Sex"
              options={[
                { value: "female", label: "Female" },
                { value: "male", label: "Male" },
              ]}
              value={sex}
              onChange={(v) => setSex(v)}
            />
          </div>
          <StepperInput label="Height" value={heightCm} unit="cm" onChange={setHeightCm} min={120} max={210} />
          <StepperInput label="Weight" value={weightKg} unit="kg" onChange={setWeightKg} min={30} max={200} step={0.5} />
          <Select
            label="Activity level"
            id="activity"
            value={activity}
            onChange={setActivity}
            options={[
              { value: "sedentary", label: "Mostly sitting" },
              { value: "light", label: "Light (walks, light chores)" },
              { value: "moderate", label: "Moderate" },
              { value: "active", label: "Active" },
            ]}
          />
          <Select
            label={lang === "bn" ? "বিভাগ (আবহাওয়া ও বায়ুমান)" : "Division (Weather & AQI)"}
            id="homeRegion"
            value={homeRegion}
            onChange={setHomeRegion}
            options={[
              { value: "dhaka", label: "Dhaka (ঢাকা)" },
              { value: "chattogram", label: "Chattogram (চট্টগ্রাম)" },
              { value: "sylhet", label: "Sylhet (সিলেট)" },
              { value: "rajshahi", label: "Rajshahi (রাজশাহী)" },
              { value: "khulna", label: "Khulna (খুলনা)" },
              { value: "barishal", label: "Barishal (বরিশাল)" },
              { value: "rangpur", label: "Rangpur (রংপুর)" },
              { value: "mymensingh", label: "Mymensingh (ময়মনসিংহ)" },
            ]}
          />
        </div>
      ),
    },
    {
      title: t("onboarding.measuresTitle"),
      body: (
        <div className="space-y-4">
          <div className="tile flex items-center justify-between p-4">
            <div>
              <p className="text-xs font-semibold text-ink/50">Asian BMI</p>
              <p className="font-num text-3xl font-extrabold tabular">{bmiVal.toFixed(1)}</p>
              <p className="mt-1 text-sm text-ink/60">{bmiLabel}</p>
            </div>
            <div className="text-right text-xs text-ink/50">
              <p>Cut-offs</p>
              <p className="font-bold text-ink">23 / 27.5</p>
            </div>
          </div>
          <p className="text-xs text-ink/50">
            Waist and waist-to-height ratio can be added next — they matter at lower BMI for South Asians.
          </p>
        </div>
      ),
    },
    {
      title: t("onboarding.goalTitle"),
      body:
        mode === "doctor-first" ? (
          <NoticeCard
            tone="info"
            title={t("onboarding.doctorFirst")}
            body={t("safety.referral")}
          />
        ) : (
          <div className="space-y-4">
            <SegmentedControl
              ariaLabel="Goal"
              options={[
                { value: "maintain", label: "Maintain" },
                { value: "gentle-change", label: "Gentle change" },
                { value: "build-strength", label: "Build strength" },
              ]}
              value={goal}
              onChange={setGoal}
            />
            {!mayDeficit && (
              <p className="text-sm text-ink/60">{t("onboarding.restrictedNote")}</p>
            )}
          </div>
        ),
    },
    {
      title: t("onboarding.safetyTitle"),
      body: (
        <div className="space-y-3">
          {(
            [
              ["Are you under 18?", under18, setUnder18],
              ["Are you pregnant or breastfeeding?", pregnancy, setPregnancy],
              ["Do you use insulin or sulfonylurea medicine?", insulin, setInsulin],
              ["Any heart or kidney disease?", heartKidney, setHeartKidney],
              ["History of an eating disorder?", edHistory, setEdHistory],
            ] as const
          ).map(([label, val, set]) => (
            <label key={label} className="tile flex min-h-12 cursor-pointer items-center justify-between gap-3 p-3">
              <span className="text-sm font-medium">{label}</span>
              <input
                type="checkbox"
                checked={val}
                onChange={(e) => (set as (v: boolean) => void)(e.target.checked)}
                className="h-5 w-5 rounded accent-violet"
              />
            </label>
          ))}
          {mode !== "normal" && (
            <SafetyBanner mode={mode} />
          )}
          {!mayExerciseComp && mode !== "doctor-first" && (
            <p className="text-xs text-ink/50">Exercise-compensation plans are off in this mode.</p>
          )}
        </div>
      ),
    },
    {
      title: t("onboarding.styleTitle"),
      body: (
        <div className="flex flex-wrap gap-2">
          {["rice-heavy", "roti-heavy", "vegetarian", "no-beef", "halal-only", "fasting"].map((s) => {
            const on = eatingStyle.includes(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() =>
                  setEatingStyle(on ? eatingStyle.filter((x) => x !== s) : [...eatingStyle, s])
                }
                className={`min-h-11 rounded-full px-4 text-sm font-semibold ${
                  on ? "bg-violet text-white" : "bg-surface-soft text-ink/70"
                }`}
              >
                {s}
              </button>
            );
          })}
        </div>
      ),
    },
    {
      title: t("onboarding.budgetTitle"),
      body: (
        <div className="space-y-4">
          <Field label="Daily food budget (taka)" htmlFor="budget">
            <input
              id="budget"
              type="range"
              min={80}
              max={600}
              step={10}
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="h-2 w-full accent-violet"
            />
            <p className="font-num mt-2 text-2xl font-extrabold tabular">৳{budget}</p>
          </Field>
          <p className="text-sm text-ink/60">Household: who cooks, how many eat from the pot, meals out — add in Settings later.</p>
        </div>
      ),
    },
    {
      title: t("onboarding.routineTitle"),
      body: (
        <p className="text-sm text-ink/60">
          Prayer times and commute type tune activity suggestions. You can set these any time in Settings.
        </p>
      ),
    },
    {
      title: t("onboarding.summaryTitle"),
      body:
        mode === "doctor-first" ? (
          <NoticeCard tone="info" title={t("onboarding.doctorFirst")} body={t("safety.referral")} />
        ) : (
          <div className="space-y-3">
            <div className="tile p-4 text-sm">
              <p className="font-bold">{weightKg} kg · {heightCm} cm · BMI {bmiVal.toFixed(1)}</p>
              <p className="mt-1 text-ink/60">Goal: {goal.replace("-", " ")}</p>
              <p className="text-ink/60">Style: {eatingStyle.join(", ") || "—"}</p>
              <p className="mt-2 flex gap-2">
                <SourceTag tag="user" />
                <SourceTag tag="fctb" />
              </p>
            </div>
            <SafetyBanner mode={mode} />
            {saveError && (
              <p className="text-sm text-red-600" role="alert">
                {saveError}
              </p>
            )}
          </div>
        ),
    },
  ];

  const current = steps[step];
  const canNext = step !== 1 || consent;

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-6">
        <SegmentedProgress segments={total} filled={step + 1} />
        <p className="mt-2 text-xs font-semibold text-ink/50">
          {t("onboarding.step")} {step + 1} {t("onboarding.of")} {total}
        </p>
      </div>

      <h1 className="text-2xl font-extrabold md:text-3xl">{current.title}</h1>
      <div className="mt-6">{current.body}</div>

      <div className="mt-10 flex gap-3">
        <Button
          variant="secondary"
          onClick={() => (step === 0 ? router.push("/signup") : setStep(step - 1))}
        >
          {t("common.back")}
        </Button>
        <Button
          full
          disabled={!canNext || saving}
          onClick={() => {
            if (step === total - 1) void finish();
            else setStep(step + 1);
          }}
        >
          {saving ? "Saving…" : step === total - 1 ? t("onboarding.looksRight") : t("common.next")}
        </Button>
      </div>
    </div>
  );
}
