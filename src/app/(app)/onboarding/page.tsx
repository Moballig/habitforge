"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { Button, Field, SegmentedControl, Select, StepperInput } from "@/components/forms/Forms";
import { SegmentedProgress } from "@/components/data/Charts";
import { SourceTag } from "@/components/data/Primitives";
import { NoticeCard, SafetyBanner } from "@/components/shell/Banners";
import type { SafetyMode } from "@/lib/types";

// Lightweight client-side screeners — UI only; engine owns final safetyMode in Wave 1.
function screenSafety(answers: {
  under18: boolean;
  pregnancy: boolean;
  lowBmi: boolean;
  insulin: boolean;
  heartKidney: boolean;
  edHistory: boolean;
}): SafetyMode {
  if (answers.edHistory || answers.insulin || answers.heartKidney || answers.under18 || answers.pregnancy) {
    return "doctor-first";
  }
  if (answers.lowBmi) return "restricted";
  return "normal";
}

export default function OnboardingPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const total = 10;

  const [age, setAge] = useState(28);
  const [sex, setSex] = useState<"male" | "female">("female");
  const [heightCm, setHeightCm] = useState(160);
  const [weightKg, setWeightKg] = useState(62);
  const [activity, setActivity] = useState("light");
  const [goal, setGoal] = useState("gentle-change");
  const [under18, setUnder18] = useState(false);
  const [pregnancy, setPregnancy] = useState(false);
  const [insulin, setInsulin] = useState(false);
  const [heartKidney, setHeartKidney] = useState(false);
  const [edHistory, setEdHistory] = useState(false);
  const [eatingStyle, setEatingStyle] = useState<string[]>(["rice-heavy"]);
  const [budget, setBudget] = useState(250);
  const [consent, setConsent] = useState(false);

  const bmi = useMemo(() => {
    const m = heightCm / 100;
    return weightKg / (m * m);
  }, [heightCm, weightKg]);

  const safetyMode = useMemo(
    () => screenSafety({ under18: age < 18 || under18, pregnancy, lowBmi: bmi < 18.5, insulin, heartKidney, edHistory }),
    [age, under18, pregnancy, bmi, insulin, heartKidney, edHistory],
  );

  // Asian cut-offs 23 / 27.5
  const bmiCategory = bmi >= 27.5 ? "obese-range" : bmi >= 23 ? "overweight-range" : "healthy-range";
  const bmiLabel =
    bmiCategory === "obese-range" ? "Above 27.5 — higher risk band (Asian cut-off)" :
    bmiCategory === "overweight-range" ? "23–27.5 — watch band (Asian cut-off)" :
    "Below 23 — healthy band (Asian cut-off)";

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
            value="normal"
            onChange={() => {}}
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
              <p className="font-num text-3xl font-extrabold tabular">{bmi.toFixed(1)}</p>
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
        safetyMode === "doctor-first" ? (
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
            {safetyMode === "restricted" && (
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
          {safetyMode !== "normal" && (
            <SafetyBanner mode={safetyMode} />
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
        safetyMode === "doctor-first" ? (
          <NoticeCard tone="info" title={t("onboarding.doctorFirst")} body={t("safety.referral")} />
        ) : (
          <div className="space-y-3">
            <div className="tile p-4 text-sm">
              <p className="font-bold">{weightKg} kg · {heightCm} cm · BMI {bmi.toFixed(1)}</p>
              <p className="mt-1 text-ink/60">Goal: {goal.replace("-", " ")}</p>
              <p className="text-ink/60">Style: {eatingStyle.join(", ") || "—"}</p>
              <p className="mt-2 flex gap-2">
                <SourceTag tag="user" />
                <SourceTag tag="fctb" />
              </p>
            </div>
            <SafetyBanner mode={safetyMode} />
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
          disabled={!canNext}
          onClick={() => {
            if (step === total - 1) router.push("/home");
            else setStep(step + 1);
          }}
        >
          {step === total - 1 ? t("onboarding.looksRight") : t("common.next")}
        </Button>
      </div>
    </div>
  );
}
