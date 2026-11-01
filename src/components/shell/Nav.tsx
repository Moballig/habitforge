"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, SIDEBAR_EXTRA } from "@/lib/nav";
import { useI18n } from "@/lib/i18n";
import ThemeToggle from "@/components/ThemeToggle";

export function NavRail() {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <nav
      aria-label="Primary"
      className="hidden md:flex lg:hidden fixed left-4 top-1/2 -translate-y-1/2 z-40 flex-col items-center gap-2 rounded-full bg-violet px-3 py-4 shadow-card"
    >
      {NAV_ITEMS.map((item) => {
        const active = pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={t(item.labelKey)}
            aria-current={active ? "page" : undefined}
            className={`flex h-11 w-11 items-center justify-center rounded-full transition ${
              active ? "bg-white/25 text-white" : "text-white/70 hover:text-white hover:bg-white/10"
            }`}
          >
            <Icon size={20} aria-hidden />
          </Link>
        );
      })}
      <div className="my-1 h-px w-6 bg-white/25" />
      <ThemeToggle variant="rail" />
    </nav>
  );
}

export function SideNav() {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <nav
      aria-label="Primary"
      className="hidden lg:flex flex-col gap-1 w-56 shrink-0 py-6 pr-2"
    >
      <Link href="/home" className="flex items-center gap-2 px-3 pb-6">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet text-sm font-extrabold text-white">
          DH
        </span>
        <span className="text-[15px] font-bold">Deshi Health</span>
      </Link>
      {NAV_ITEMS.map((item) => {
        const active = pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-11 items-center gap-3 rounded-full px-4 text-[15px] font-semibold transition ${
              active
                ? "bg-blue text-white"
                : "text-ink/70 hover:bg-surface-soft hover:text-ink"
            }`}
          >
            <Icon size={18} aria-hidden />
            {t(item.labelKey)}
          </Link>
        );
      })}
      <div className="my-3 h-px bg-border" />
      {SIDEBAR_EXTRA.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`flex min-h-11 items-center gap-3 rounded-full px-4 text-[15px] font-semibold transition ${
            pathname.startsWith(item.href)
              ? "bg-blue text-white"
              : "text-ink/70 hover:bg-surface-soft hover:text-ink"
          }`}
        >
          {t(item.labelKey)}
        </Link>
      ))}
      <div className="mt-auto flex items-center gap-2 px-3 pt-6">
        <ThemeToggle variant="inline" />
      </div>
    </nav>
  );
}

export function BottomTabs() {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <nav
      aria-label="Primary"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-surface/95 backdrop-blur pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto flex max-w-md items-end justify-around px-2 pt-2">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          if (item.center) {
            return (
              <li key={item.href} className="-mt-5">
                <Link
                  href={item.href}
                  aria-label={t(item.labelKey)}
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-violet text-white shadow-card"
                >
                  <Icon size={26} aria-hidden />
                </Link>
              </li>
            );
          }
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-11 flex-col items-center gap-0.5 rounded-t-xl py-1.5 text-[11px] font-semibold ${
                  active ? "text-violet" : "text-ink/50"
                }`}
              >
                <Icon size={20} aria-hidden />
                {t(item.labelKey)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
