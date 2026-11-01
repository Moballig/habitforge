"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Search, User } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import ThemeToggle from "@/components/ThemeToggle";

const TITLES: Record<string, string> = {
  "/home": "nav.home",
  "/plan": "nav.plan",
  "/log": "nav.log",
  "/coach": "nav.coach",
  "/activity": "nav.activity",
  "/settings": "nav.settings",
  "/insights": "nav.insights",
};

export default function TopBar({ title }: { title?: string }) {
  const pathname = usePathname();
  const { t, lang, setLang } = useI18n();
  const router = useRouter();
  const key = Object.keys(TITLES).find((k) => pathname.startsWith(k));
  const label = title ?? (key ? t(TITLES[key]) : "");

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border/60 bg-canvas/90 px-4 py-3 backdrop-blur md:px-8">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet text-xs font-extrabold text-white lg:hidden">
          DH
        </span>
        <h1 className="truncate text-lg font-bold md:text-xl">{label}</h1>
      </div>

      <button
        type="button"
        aria-label={t("common.search")}
        onClick={() => router.push("/log")}
        className="hidden h-11 w-64 items-center gap-2 rounded-full border border-border bg-surface px-4 text-sm text-ink/45 md:flex"
      >
        <Search size={16} aria-hidden />
        {t("common.search")}
      </button>

      <button
        type="button"
        onClick={() => setLang(lang === "en" ? "bn" : "en")}
        className="min-h-11 rounded-full border border-border bg-surface px-3 text-sm font-semibold"
        aria-label="Switch language"
      >
        {lang === "en" ? "বাংলা" : "EN"}
      </button>

      <ThemeToggle variant="top" />

      <button
        type="button"
        aria-label="Notifications"
        className="relative flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface"
      >
        <Bell size={18} aria-hidden />
        <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-coral" />
      </button>

      <Link
        href="/settings"
        aria-label={t("nav.settings")}
        className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface"
      >
        <User size={18} aria-hidden />
      </Link>
    </header>
  );
}
