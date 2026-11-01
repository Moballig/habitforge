"use client";

import { useRef, useState } from "react";
import { Camera, RefreshCw, Upload } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/forms/Forms";
import { Range, SectionLabel, SourceTag } from "@/components/data/Primitives";
import { NoticeCard } from "@/components/shell/Banners";
import { useRouter } from "next/navigation";

type Guess = {
  nameEn: string;
  nameBn: string;
  low: number;
  high: number;
  conf: "high" | "medium" | "low";
  source: "measured" | "ai-assisted";
};

// Demo parse result — Wave 5 replaces with ai.analyzePhoto.
const DEMO_GUESSES: Guess[] = [
  { nameEn: "Steamed rice", nameBn: "ভাত", low: 240, high: 300, conf: "high", source: "ai-assisted" },
  { nameEn: "Lentil curry", nameBn: "ডাল", low: 130, high: 200, conf: "medium", source: "ai-assisted" },
  { nameEn: "Fish curry", nameBn: "মাছ", low: 140, high: 200, conf: "medium", source: "ai-assisted" },
];

export default function PhotoLogPage() {
  const { t } = useI18n();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const [result, setResult] = useState<Guess[] | null>(null);
  const [picked, setPicked] = useState<number[]>([0, 1, 2]);
  const [saved, setSaved] = useState(false);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setPreview(URL.createObjectURL(f));
    setResult(null);
    setSaved(false);
    setReading(true);
    setTimeout(() => {
      setReading(false);
      setResult(DEMO_GUESSES);
    }, 900);
  }

  function toggle(i: number) {
    setPicked((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]));
  }

  const selected = (result ?? []).filter((_, i) => picked.includes(i));
  const low = selected.reduce((s, g) => s + g.low, 0);
  const high = selected.reduce((s, g) => s + g.high, 0);

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold md:text-3xl">{t("log.photo")}</h1>
        <p className="mt-1 text-sm text-ink/55">{t("log.reading")}</p>
      </header>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onFile}
        className="sr-only"
      />

      {!preview ? (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-3 rounded-card border-2 border-dashed border-border bg-surface-soft text-ink/50 transition hover:border-violet hover:text-violet"
        >
          <Camera size={40} />
          <span className="text-sm font-bold">{t("log.photo")}</span>
          <span className="text-xs">tap to open camera</span>
        </button>
      ) : (
        <div className="overflow-hidden rounded-card">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Your plate" className="aspect-[4/3] w-full object-cover" />
        </div>
      )}

      <div className="flex gap-2">
        <Button variant="secondary" full onClick={() => fileRef.current?.click()}>
          <RefreshCw size={15} /> Retake
        </Button>
        <Button variant="secondary" full onClick={() => fileRef.current?.click()}>
          <Upload size={15} /> Gallery
        </Button>
      </div>

      {reading && (
        <div className="flex items-center gap-3 rounded-tile bg-lilac px-4 py-3 text-sm font-semibold text-lilac-ink">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          {t("log.reading")}
        </div>
      )}

      {result && (
        <section>
          <SectionLabel>{t("log.parseTitle")}</SectionLabel>
          <ul className="space-y-2">
            {result.map((g, i) => {
              const on = picked.includes(i);
              return (
                <li key={g.nameEn}>
                  <button
                    type="button"
                    onClick={() => toggle(i)}
                    aria-pressed={on}
                    className={`card flex w-full items-center justify-between gap-3 p-4 text-left ${
                      on ? "ring-2 ring-violet" : ""
                    }`}
                  >
                    <div>
                      <p className="font-bold">
                        {on ? "✓ " : ""}
                        {g.nameBn} <span className="text-sm font-medium text-ink/50">{g.nameEn}</span>
                      </p>
                      <div className="mt-1 flex gap-2">
                        <SourceTag tag={g.source} />
                        <span className="text-[11px] font-semibold text-ink/45">
                          conf: {g.conf}
                        </span>
                      </div>
                    </div>
                    <Range low={g.low} high={g.high} className="shrink-0 text-sm font-bold" />
                  </button>
                </li>
              );
            })}
          </ul>
          <NoticeCard
            tone="gentle"
            title={t("log.aiEstimate")}
            body="Tap items to include or exclude. Portions are approximate — adjust in the sheet."
          />
        </section>
      )}

      {result && (
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => router.back()}>
            {t("common.back")}
          </Button>
          <Button
            full
            disabled={selected.length === 0 || saved}
            onClick={() => setSaved(true)}
          >
            {saved ? `✓ ${t("states.saved")}` : `${t("log.confirmSave")} (${low}–${high} kcal)`}
          </Button>
        </div>
      )}
    </div>
  );
}
