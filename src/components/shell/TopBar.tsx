"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, Search, User, Users, Settings, X, Globe } from "lucide-react";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import ThemeToggle from "@/components/ThemeToggle";
import { SyncStatusPill } from "@/components/shell/Banners";

const TITLES: Record<string, string> = {
  "/home": "nav.home",
  "/plan": "nav.plan",
  "/log": "nav.log",
  "/coach": "nav.coach",
  "/activity": "nav.activity",
  "/settings": "nav.settings",
  "/insights": "nav.progress",
  "/family": "nav.family",
};

export default function TopBar({ title }: { title?: string }) {
  const pathname = usePathname();
  const { t, lang, setLang } = useI18n();
  const router = useRouter();
  const [showMore, setShowMore] = useState(false);
  const key = Object.keys(TITLES).find((k) => pathname.startsWith(k));
  const label = title ?? (key ? t(TITLES[key]) : "");

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border/60 bg-surface/90 px-4 py-3 backdrop-blur md:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet text-xs font-extrabold text-white lg:hidden">
            DH
          </span>
          <h1 className="truncate text-lg font-bold md:text-xl">{label}</h1>
          <SyncStatusPill />
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
          onClick={() => setShowMore(true)}
          aria-label={lang === "bn" ? "আরও মেনু" : "More menu"}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface transition hover:bg-surface-soft active:scale-95"
        >
          <User size={18} aria-hidden />
        </button>
      </header>

      {/* Mobile & Tablet "More" Bottom Sheet */}
      {showMore && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in">
          <div
            className="fixed inset-0"
            onClick={() => setShowMore(false)}
            aria-hidden="true"
          />
          <div className="relative z-10 w-full max-w-lg mx-auto rounded-t-3xl border-t border-border bg-surface p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <h2 className="text-base font-extrabold text-ink">
                {lang === "bn" ? "আরও সেবা ও সেটিংস" : "More & Settings"}
              </h2>
              <button
                type="button"
                onClick={() => setShowMore(false)}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-surface-soft text-ink/60"
              >
                <X size={18} />
              </button>
            </div>

            <nav className="grid gap-2">
              <Link
                href="/insights"
                onClick={() => setShowMore(false)}
                className={`flex items-center gap-3.5 rounded-2xl p-3.5 font-bold transition ${
                  pathname.startsWith("/insights")
                    ? "bg-violet text-white shadow-xs"
                    : "bg-surface-soft hover:bg-border/60 text-ink"
                }`}
              >
                <BarChart3 size={20} className={pathname.startsWith("/insights") ? "text-white" : "text-violet"} />
                <div className="flex-1">
                  <p className="text-sm leading-tight">{t("nav.progress")}</p>
                  <p className={`text-xs ${pathname.startsWith("/insights") ? "text-white/80" : "text-ink/55"}`}>
                    {lang === "bn" ? "ওজন ও অগ্রগতি পর্যবেক্ষণ" : "Weight trend & adaptivity"}
                  </p>
                </div>
              </Link>

              <Link
                href="/family"
                onClick={() => setShowMore(false)}
                className={`flex items-center gap-3.5 rounded-2xl p-3.5 font-bold transition ${
                  pathname.startsWith("/family")
                    ? "bg-violet text-white shadow-xs"
                    : "bg-surface-soft hover:bg-border/60 text-ink"
                }`}
              >
                <Users size={20} className={pathname.startsWith("/family") ? "text-white" : "text-violet"} />
                <div className="flex-1">
                  <p className="text-sm leading-tight">{t("nav.family")}</p>
                  <p className={`text-xs ${pathname.startsWith("/family") ? "text-white/80" : "text-ink/55"}`}>
                    {lang === "bn" ? "এক পাত্রের পারিবারিক রান্না" : "Shared pot & member portions"}
                  </p>
                </div>
              </Link>

              <Link
                href="/settings"
                onClick={() => setShowMore(false)}
                className={`flex items-center gap-3.5 rounded-2xl p-3.5 font-bold transition ${
                  pathname.startsWith("/settings")
                    ? "bg-violet text-white shadow-xs"
                    : "bg-surface-soft hover:bg-border/60 text-ink"
                }`}
              >
                <Settings size={20} className={pathname.startsWith("/settings") ? "text-white" : "text-violet"} />
                <div className="flex-1">
                  <p className="text-sm leading-tight">{t("nav.settings")}</p>
                  <p className={`text-xs ${pathname.startsWith("/settings") ? "text-white/80" : "text-ink/55"}`}>
                    {lang === "bn" ? "প্রোফাইল, ভাষা ও নিরাপত্তা" : "Profile, language & preferences"}
                  </p>
                </div>
              </Link>
            </nav>

            <div className="flex items-center justify-between pt-2 border-t border-border/60">
              <button
                type="button"
                onClick={() => {
                  setLang(lang === "en" ? "bn" : "en");
                  setShowMore(false);
                }}
                className="flex items-center gap-2 text-xs font-semibold text-ink/70 hover:text-ink"
              >
                <Globe size={16} />
                <span>{lang === "en" ? "বাংলা ভাষায় বদলান" : "Switch to English"}</span>
              </button>
              <span className="text-[11px] font-bold text-ink/40">Deshi Health Companion</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
