"use client";

import { useRef, useState, useEffect } from "react";
import { useAction, useQuery } from "convex/react";
import { Send, Square } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import { useI18n } from "@/lib/i18n";
import { COACH_SEED } from "@/lib/mock";
import { embedQuery, type RagHit } from "@/lib/ai/rag";
import type { Citation, CoachMessage } from "@/lib/types";
import { MessageBubble, SuggestionChips } from "@/components/chat/Chat";
import { EmptyState, SourceTag } from "@/components/data/Primitives";
import { SafetyBanner } from "@/components/shell/Banners";

function clock(): string {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/** Hybrid-score floor for passing a chunk to the model as a citation source. */
const CONTEXT_THRESHOLD = 0.8;
const CONTEXT_LIMIT = 5;
const CONTEXT_CHARS = 700;

function citationFrom(hit: RagHit): Citation {
  return {
    section: hit.section ? `${hit.source} — ${hit.section}` : hit.source,
    page: hit.page,
  };
}

/** Collect the [n] markers the model actually used → citation chips. */
function collectCitations(text: string, hits: RagHit[]): Citation[] {
  const cited: Citation[] = [];
  const seen = new Set<string>();
  for (const match of text.matchAll(/\[(\d{1,2})\]/g)) {
    const hit = hits[Number(match[1]) - 1];
    if (!hit) continue;
    const citation = citationFrom(hit);
    const key = `${citation.section}-${citation.page ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    cited.push(citation);
  }
  return cited;
}

/** Union two result sets, keeping the best score per chunk. */
function mergeHits(a: RagHit[], b: RagHit[]): RagHit[] {
  const byId = new Map<string, RagHit>();
  for (const hit of [...a, ...b]) {
    const previous = byId.get(hit.id);
    if (!previous || hit.score > previous.score) byId.set(hit.id, hit);
  }
  return [...byId.values()].sort((x, y) => y.score - x.score);
}

export default function CoachPage() {
  const { t } = useI18n();
  const [messages, setMessages] = useState<CoachMessage[]>(COACH_SEED);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef(0);

  const search = useAction(api.rag.search);
  const chat = useAction(api.ai.chat);
  const rewrite = useAction(api.ai.rewriteQuery);
  const profile = useQuery(api.profile.get, {});

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  async function send(text: string) {
    const q = text.trim();
    if (!q || thinking) return;
    setInput("");
    setMessages((m) => [
      ...m,
      { id: `u-${Date.now()}`, role: "user", text: q, time: clock() },
    ]);
    setThinking(true);
    const request = ++requestRef.current;

    // 1) Retrieve: local embedding → hybrid search. Falls back to keyword-only.
    //    Bangla queries (or weak first-pass scores) get an English rewrite for
    //    the vector pass; keyword search always keeps the original wording.
    let hits: RagHit[] = [];
    let lowConfidence = false;
    try {
      const embedding = await embedQuery(q);
      let results: RagHit[] = await search({ query: q, queryEmbedding: embedding, limit: 6 });
      const hasBangla = /[\u0980-\u09FF]/.test(q);
      if (hasBangla || (results[0]?.score ?? 0) < CONTEXT_THRESHOLD) {
        const attempt = await rewrite({ query: q.slice(0, 300) });
        if (attempt.rewritten && request === requestRef.current) {
          const rewrittenEmbedding = await embedQuery(attempt.rewritten);
          if (rewrittenEmbedding) {
            const second = await search({
              query: q,
              queryEmbedding: rewrittenEmbedding,
              limit: 6,
            });
            results = mergeHits(results, second);
          }
        }
      }
      if (request !== requestRef.current) return;
      hits = results.filter((h) => h.score >= CONTEXT_THRESHOLD).slice(0, CONTEXT_LIMIT);
      if (hits.length === 0) lowConfidence = true;
    } catch {
      lowConfidence = true;
    }
    if (request !== requestRef.current) return;

    if (lowConfidence || hits.length === 0) {
      setMessages((m) => [
        ...m,
        {
          id: `c-${Date.now()}`,
          role: "coach",
          text: t("coach.lowConf"),
          time: clock(),
          lowConfidence: true,
        },
      ]);
      setThinking(false);
      return;
    }

    // 2) Answer with excerpts + safe context only (no PII).
    const lang = /[\u0980-\u09FF]/.test(q) ? "bn" : "en";
    try {
      const reply = await chat({
        message: q,
        safeContext: {
          // Fail closed while the live profile is loading or absent.
          mode: profile?.safetyMode ?? "doctor-first",
          goal: profile?.goal ?? "maintain",
          lang,
        },
        context: hits.map((h) => ({
          text: h.text.slice(0, CONTEXT_CHARS),
          source: h.source,
          section: h.section,
          page: h.page,
        })),
      });
      if (request !== requestRef.current) return;
      if (reply.error || !reply.response) {
        setMessages((m) => [
          ...m,
          {
            id: `c-${Date.now()}`,
            role: "coach",
            text: reply.error ?? "No response from the coach.",
            time: clock(),
            lowConfidence: true,
          },
        ]);
      } else {
        setMessages((m) => [
          ...m,
          {
            id: `c-${Date.now()}`,
            role: "coach",
            text: reply.response,
            citations: collectCitations(reply.response, hits),
            lowConfidence,
            time: clock(),
          },
        ]);
      }
    } catch (error) {
      if (request !== requestRef.current) return;
      const message = error instanceof Error ? error.message : String(error);
      setMessages((m) => [
        ...m,
        {
          id: `c-${Date.now()}`,
          role: "coach",
          text: `AI request failed: ${message.slice(0, 200)}`,
          time: clock(),
          lowConfidence: true,
        },
      ]);
    } finally {
      if (request === requestRef.current) setThinking(false);
    }
  }

  function stop() {
    requestRef.current += 1;
    setThinking(false);
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold md:text-3xl">{t("coach.title")}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ink/50">
            <SourceTag tag="borrowed" /> national guidelines · RAG
          </p>
        </div>
      </header>

      <SafetyBanner mode={profile?.safetyMode ?? "doctor-first"} />

      <div className="mt-4 flex-1 space-y-4 overflow-y-auto pb-4">
        {messages.length === 0 ? (
          <EmptyState title={t("coach.title")} body={t("coach.empty")} />
        ) : (
          messages.map((m) => <MessageBubble key={m.id} m={m} />)
        )}
        {thinking && (
          <div className="flex justify-start">
            <div className="rounded-card bg-surface-soft px-4 py-3">
              <span className="inline-flex gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-ink/40 [animation-delay:0ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-ink/40 [animation-delay:150ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-ink/40 [animation-delay:300ms]" />
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {messages.length <= 2 && (
        <div className="mb-3">
          <SuggestionChips onPick={send} />
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="sticky bottom-0 flex gap-2 border-t border-border bg-surface pt-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("coach.ph")}
          aria-label={t("coach.title")}
          className="pill-input min-h-14 flex-1 text-[15px]"
        />
        {thinking ? (
          <button
            type="button"
            onClick={stop}
            aria-label={t("coach.stop")}
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-coral text-white"
          >
            <Square size={18} fill="currentColor" />
          </button>
        ) : (
          <button
            type="submit"
            aria-label="Send"
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-violet text-white disabled:opacity-40"
            disabled={!input.trim()}
          >
            <Send size={20} />
          </button>
        )}
      </form>
    </div>
  );
}
