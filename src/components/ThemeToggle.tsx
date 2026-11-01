'use client';

import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const toggle = () => {
    const el = document.documentElement;
    const next = !el.classList.contains('dark');
    el.classList.toggle('dark', next);
    try {
      localStorage.setItem('habitforge_theme', next ? 'dark' : 'light');
    } catch {
      // localStorage unavailable — session-only toggle still works
    }
  };

  return (
    <button
      onClick={toggle}
      aria-label="Toggle dark mode"
      title="Toggle dark mode"
      className="p-2.5 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
    >
      {/* Icon swaps via CSS — no JS state, no hydration mismatch */}
      <Sun className="w-5 h-5 hidden dark:block" />
      <Moon className="w-5 h-5 block dark:hidden" />
    </button>
  );
}
