"use client";

import { useRef, useState, useEffect } from "react";
import { Send, Square } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { COACH_SEED } from "@/lib/mock";
import type { CoachMessage } from "@/lib/types";
import { MessageBubble, SuggestionChips, RefusalCard } from "@/components/chat/Chat";
import { EmptyState, SourceTag } from "@/components/data/Primitives";
import { SafetyBanner } from "@/components/shell/Banners";
import { DEMO_PROFILE } from "@/lib/mock";

function clock(): string {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// Demo-only reply; Wave 5 replaces with ai.chat action (RAG + citations).
function demoReply(q: string): CoachMessage {
  const lower = q.toLowerCase();
  const refusal = /diagnosis|medicine|insulin dose|কোন ওষুধ/.test(lower);
  if (refusal) {
    return {
      id: `d-${Date.now()}`,
      role: "coach",
      text: "এটায় আমি সাহায্য করতে পারি না, কিন্তু খাবারের পরিমাণ নিয়ে পরামর্শ দিতে পারি।",
      refusal: true,
      time: clock(),
    };
  }
  return {
    id: `d-${Date.now()}`,
    role: "coach",
    text: "ন্যূনতম প্রোটিন বাড়াতে ডিম, ছোট মাছ বা ডাল যোগ করুন। প্রতিদিন এক মুঠো বাদামও ভালো। প্লেটের এক-চতুর্থাংশ প্রোটিন রাখার চেষ্টা করুন।",
    citations: [{ section: "Protein guidance — Daily needs", page: 42 }],
    toolNumbers: ["plate ¼ protein"],
    time: clock(),
  };
}

export default function CoachPage() {
  const { t } = useI18n();
  const [messages, setMessages] = useState<CoachMessage[]>(COACH_SEED);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [showRefusal, setShowRefusal] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  function send(text: string) {
    const q = text.trim();
    if (!q || thinking) return;
    setInput("");
    setMessages((m) => [
      ...m,
      { id: `u-${Date.now()}`, role: "user", text: q, time: clock() },
    ]);
    setThinking(true);
    setShowRefusal(false);
    timerRef.current = setTimeout(() => {
      const reply = demoReply(q);
      setMessages((m) => [...m, reply]);
      setThinking(false);
      if (reply.refusal) setShowRefusal(true);
    }, 700);
  }

  function stop() {
    if (timerRef.current) clearTimeout(timerRef.current);
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

      <SafetyBanner mode={DEMO_PROFILE.safetyMode} />

      <div className="mt-4 flex-1 space-y-4 overflow-y-auto pb-4">
        {messages.length === 0 ? (
          <EmptyState title={t("coach.title")} body={t("coach.empty")} />
        ) : (
          messages.map((m) => <MessageBubble key={m.id} m={m} />)
        )}
        {showRefusal && <RefusalCard />}
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
