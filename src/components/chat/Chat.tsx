"use client";

import { CitationChip } from "@/components/data/Cards";
import { Range, SourceTag, ToolNumber } from "@/components/data/Primitives";
import { NoticeCard } from "@/components/shell/Banners";
import { useI18n } from "@/lib/i18n";
import type { CoachMessage } from "@/lib/types";

export function MessageBubble({ m }: { m: CoachMessage }) {
  const isUser = m.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-card px-4 py-3 text-sm leading-relaxed ${
          isUser ? "bg-violet text-white" : "bg-surface-soft text-ink"
        }`}
      >
        <p className="whitespace-pre-wrap">{m.text}</p>

        {m.toolNumbers && m.toolNumbers.length > 0 && !isUser && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {m.toolNumbers.map((n) => (
              <ToolNumber key={n}>{n}</ToolNumber>
            ))}
          </div>
        )}

        {m.citations && m.citations.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {m.citations.map((c) => (
              <CitationChip key={`${c.section}-${c.page}`} section={c.section} page={c.page} />
            ))}
          </div>
        )}

        {m.lowConfidence && (
          <p className="mt-2 text-xs font-semibold text-turmeric">
            {isUser ? "" : "· low confidence"}
          </p>
        )}

        <p className={`mt-2 text-[10px] ${isUser ? "text-white/60" : "text-ink/40"}`}>{m.time}</p>
      </div>
    </div>
  );
}

export function SuggestionChips({ onPick }: { onPick: (s: string) => void }) {
  const { t } = useI18n();
  const keys = ["coach.suggest1", "coach.suggest2", "coach.suggest3"];
  return (
    <div className="flex flex-wrap gap-2">
      {keys.map((k) => (
        <button
          key={k}
          type="button"
          onClick={() => onPick(t(k))}
          className="min-h-11 rounded-full border border-border bg-surface px-4 text-sm font-semibold text-ink/70 transition hover:border-violet hover:text-violet"
        >
          {t(k)}
        </button>
      ))}
    </div>
  );
}

export function RefusalCard() {
  const { t } = useI18n();
  return <NoticeCard tone="info" title={t("coach.refusal")} body={t("coach.lowConf")} />;
}

export function MealSuggestionCard({
  title,
  body,
  why,
  kcalLow,
  kcalHigh,
  onAdd,
}: {
  title: string;
  body: string;
  why?: string;
  kcalLow?: number;
  kcalHigh?: number;
  onAdd?: () => void;
}) {
  const { t } = useI18n();
  return (
    <div className="card overflow-hidden">
      <div className="bg-violet/10 px-4 py-3">
        <p className="text-sm font-bold text-violet">{title}</p>
      </div>
      <div className="p-4">
        <p className="text-sm text-ink/70">{body}</p>
        {kcalLow != null && kcalHigh != null && (
          <p className="mt-2">
            <Range low={kcalLow} high={kcalHigh} className="text-sm font-bold" />
          </p>
        )}
        {why && (
          <p className="mt-2 text-xs text-ink/50">
            <span className="font-bold text-ink/60">{t("coach.why")}:</span> {why}
          </p>
        )}
        <div className="mt-3 flex items-center justify-between">
          <SourceTag tag="borrowed" />
          {onAdd && (
            <button
              type="button"
              onClick={onAdd}
              className="min-h-11 rounded-full bg-violet px-4 text-sm font-bold text-white"
            >
              {t("log.confirmSave")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
