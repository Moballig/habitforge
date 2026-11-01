'use client';

import { useMemo } from 'react';
import { HabitCategory, CATEGORY_CONFIG } from '@/lib/types';

interface CategoryChartProps {
  habits: Array<{ category: HabitCategory }>;
}

export default function CategoryChart({ habits }: CategoryChartProps) {
  const rows = useMemo(() => {
    const counts = new Map<HabitCategory, number>();
    habits.forEach((h) => counts.set(h.category, (counts.get(h.category) || 0) + 1));
    const total = habits.length;
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([category, count]) => ({
        category,
        count,
        pct: total > 0 ? Math.round((count / total) * 100) : 0,
        ...CATEGORY_CONFIG[category],
      }));
  }, [habits]);

  const max = rows.length > 0 ? rows[0].count : 1;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Habit Distribution
        </h3>
        <span className="text-xs font-medium px-2 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
          {habits.length} total
        </span>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
        Your habits grouped by category
      </p>

      {rows.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">
          No categories yet — add some habits!
        </p>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.category}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{row.emoji}</span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {row.label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                    {row.count}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 w-8 text-right">
                    {row.pct}%
                  </span>
                </div>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${(row.count / max) * 100}%`,
                    backgroundColor: row.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
