'use client';

import { useLayoutEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

const STORAGE_KEY = 'habitforge_theme';

function applyTheme() {
  let dark: boolean;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    dark = stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch {
    dark = false;
  }
  document.documentElement.classList.toggle('dark', dark);
}

export default function ThemeToggle() {
  // Dev-only: React Strict Mode remount resets <html> attributes, clearing the
  // class the inline script set — re-apply before paint. No-op in production.
  useLayoutEffect(() => {
    applyTheme();
  }, []);

  const toggle = () => {
    const next = !document.documentElement.classList.contains('dark');
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light');
    } catch {
      // localStorage unavailable — session-only toggle still works
    }
  };

  return (
    <button
      onClick={toggle}
      aria-label="Toggle dark mode"
      title="Toggle dark mode"
      className="p-2.5 rounded-2xl text-muted-fg hover:bg-muted hover:text-foreground transition-colors clay-sm"
    >
      {/* Icon swaps via CSS — no JS state, no hydration mismatch */}
      <Sun className="w-5 h-5 hidden dark:block" aria-hidden="true" />
      <Moon className="w-5 h-5 block dark:hidden" aria-hidden="true" />
    </button>
  );
}
