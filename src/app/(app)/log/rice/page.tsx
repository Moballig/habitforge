"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { Button, Field } from "@/components/forms/Forms";
import { Range, SectionLabel, SourceTag } from "@/components/data/Primitives";
import { NoticeCard } from "@/components/shell/Banners";

// Demo calibration — engine (lib/engine) owns the real formula in Wave 3.
function batiKcal(batis: number, kind: "white" | "brown" | "polao"): number {
  const per = kind === "white" ? 260 : kind === "brown" ? 230 : 340;
  return batis * per;
}

export default function RiceCalibratorPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [batis, setBatis] = useState(1.5);
  const [kind, setKind] = useState<"white" | "brown" | "polao">("white");
  const [saved, setSaved] = useState(false);

  const mid = batiKcal(batis, kind);
  const low = Math.round(mid * 0.9);
  const high = Math.round(mid * 1.12);

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold md:text-3xl">{t("log.rice")}</h1>
        <p className="mt-1 text-sm text-ink/55">
          Measure once — we remember your usual bati size.
        </p>
      </header>

      <section className="card space-y-5 p-5">
        <SectionLabel>How much rice?</SectionLabel>
        <Field label="Batis (bowls)" htmlFor="batis">
          <div className="flex items-center gap-4">
            <input
              id="batis"
              type="range"
              min={0.5}
              max={4}
              step={0.5}
              value={batis}
              onChange={(e) => setBatis(Number(e.target.value))}
              className="h-2 flex-1 accent-violet"
            />
            <span className="font-num w-14 text-right text-2xl font-extrabold tabular">{batis}</span>
          </div>
        </Field>

        <Field label="Rice type" htmlFor="kind">
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["white", "White (polish)"],
                ["brown", "Brown / atap"],
                ["polao", "Polao / khichuri"],
              ] as const
            ).map(([v, label]) => (
              <button
                key={v}
                type="button"
                onClick={() => setKind(v)}
                className={`min-h-11 rounded-full px-4 text-sm font-semibold ${
                  kind === v ? "bg-violet text-white" : "bg-surface-soft text-ink/70"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </Field>
      </section>

      <div className="rounded-card bg-violet p-5 text-white">
        <p className="text-xs font-semibold uppercase tracking-wide opacity-70">Estimated</p>
        <p className="font-num mt-1 text-3xl font-extrabold tabular">
          <Range low={low} high={high} />
        </p>
        <div className="mt-3 flex gap-2">
          <SourceTag tag="estimated-recipe" />
          <SourceTag tag="user" />
        </div>
      </div>

      <NoticeCard
        tone="gentle"
        title="Ranges, not single numbers"
        body="Oil, ghee and cooking style shift rice calories. We show a range for honesty."
      />

      <div className="flex gap-3">
        <Button variant="secondary" onClick={() => router.back()}>
          {t("common.back")}
        </Button>
        <Button full disabled={saved} onClick={() => setSaved(true)}>
          {saved ? `✓ ${t("states.saved")}` : t("common.save")}
        </Button>
      </div>
    </div>
  );
}
