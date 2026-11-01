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

function readStored<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    if (v && (allowed as readonly string[]).includes(v)) return v as T;
  } catch {
    /* ignore */
  }
  return fallback;
}

function readFlag(key: string): boolean {
  try {
    return localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

export function I18nProvider({ children }: { children: ReactNode }) {
  // Lazy SSR-safe defaults; hydrate from localStorage after mount without sync setState-in-effect.
  const [lang, setLangState] = useState<Lang>("en");
  const [largeText, setLargeTextState] = useState(false);
  const [lowLiteracy, setLowLiteracyState] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Defer to a macrotask so React treats this as an external-system sync, not a cascading render.
    const id = window.setTimeout(() => {
      setLangState(readStored("deshi_lang", ["en", "bn"] as const, "en"));
      setLargeTextState(readFlag("deshi_large_text"));
      setLowLiteracyState(readFlag("deshi_low_literacy"));
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.lang = lang;
    write("deshi_lang", lang);
  }, [lang, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.classList.toggle("large-text", largeText);
    write("deshi_large_text", largeText ? "1" : "0");
  }, [largeText, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.classList.toggle("low-literacy", lowLiteracy);
    write("deshi_low_literacy", lowLiteracy ? "1" : "0");
  }, [lowLiteracy, hydrated]);

  const setLang = useCallback((l: Lang) => setLangState(l), []);
  const setLargeText = useCallback((v: boolean) => setLargeTextState(v), []);
  const setLowLiteracy = useCallback((v: boolean) => setLowLiteracyState(v), []);

  const t = useCallback((path: string) => lookup(DICTS[lang], path), [lang]);

  const value = useMemo(
    () => ({ lang, setLang, t, largeText, setLargeText, lowLiteracy, setLowLiteracy }),
    [lang, setLang, t, largeText, setLargeText, lowLiteracy, setLowLiteracy],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n requires I18nProvider");
  return ctx;
}
