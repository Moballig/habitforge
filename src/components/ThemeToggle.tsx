"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

type Props = { variant?: "rail" | "inline" | "top" };

function subscribeDark(cb: () => void) {
  const mo = new MutationObserver(cb);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => mo.disconnect();
}

function getDarkSnapshot() {
  return document.documentElement.classList.contains("dark");
}

function getServerDarkSnapshot() {
  return false;
}

function applyDark(next: boolean) {
  document.documentElement.classList.toggle("dark", next);
  try {
    localStorage.setItem("deshi_theme", next ? "dark" : "light");
  } catch {
    /* ignore */
  }
}

export default function ThemeToggle({ variant = "top" }: Props) {
  const dark = useSyncExternalStore(subscribeDark, getDarkSnapshot, getServerDarkSnapshot);

  function toggle() {
    applyDark(!dark);
  }

  const label = dark ? "Switch to light" : "Switch to dark";

  if (variant === "rail") {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-label={label}
        className="flex h-11 w-11 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white"
      >
        {dark ? <Sun size={20} /> : <Moon size={20} />}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface text-ink/70 hover:text-ink"
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
