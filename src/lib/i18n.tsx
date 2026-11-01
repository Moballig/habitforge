"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import en from "../../messages/en.json";
import bn from "../../messages/bn.json";
import type { Lang } from "./types";

const DICTS = { en, bn } as const;

type Dict = typeof en;

type I18nValue = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (path: string) => string;
  largeText: boolean;
  setLargeText: (v: boolean) => void;
  lowLiteracy: boolean;
  setLowLiteracy: (v: boolean) => void;
};

const I18nContext = createContext<I18nValue | null>(null);

function lookup(dict: Dict, path: string): string {
  const parts = path.split(".");
  let cur: unknown = dict;
  for (const p of parts) {
    if (typeof cur !== "object" || cur === null) return path;
    cur = (cur as Record<string, unknown>)[p];
  }
  return typeof cur === "string" ? cur : path;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  const [largeText, setLargeText] = useState(false);
  const [lowLiteracy, setLowLiteracy] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("deshi_lang");
      if (stored === "bn" || stored === "en") setLangState(stored);
      const lt = localStorage.getItem("deshi_large_text");
      if (lt === "1") setLargeText(true);
      const ll = localStorage.getItem("deshi_low_literacy");
      if (ll === "1") setLowLiteracy(true);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    document.documentElement.classList.toggle("large-text", largeText);
    try {
      localStorage.setItem("deshi_large_text", largeText ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [largeText]);

  useEffect(() => {
    document.documentElement.classList.toggle("low-literacy", lowLiteracy);
    try {
      localStorage.setItem("deshi_low_literacy", lowLiteracy ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [lowLiteracy]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem("deshi_lang", l);
    } catch {
      /* ignore */
    }
  }, []);

  const t = useCallback(
    (path: string) => lookup(DICTS[lang], path),
    [lang],
  );

  const value = useMemo(
    () => ({ lang, setLang, t, largeText, setLargeText, lowLiteracy, setLowLiteracy }),
    [lang, setLang, t, largeText, lowLiteracy],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n requires I18nProvider");
  return ctx;
}
