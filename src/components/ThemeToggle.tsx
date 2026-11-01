"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

type Props = { variant?: "rail" | "inline" | "top" };

export default function ThemeToggle({ variant = "top" }: Props) {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("deshi_theme", next ? "dark" : "light");
    } catch {
      /* ignore */
    }
  }

  const label = mounted && dark ? "Switch to light" : "Switch to dark";

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
      className={`flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface text-ink/70 hover:text-ink ${
        variant === "inline" ? "" : ""
      }`}
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
