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
    <div className="card p-5">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-heading font-bold text-foreground">Habit Distribution</h3>
        <span className="pill bg-accent/15 text-accent">{habits.length} total</span>
      </div>
      <p className="text-xs text-muted-fg mb-4">
        Your habits grouped by category
      </p>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-fg py-8 text-center">
          No categories yet — add some habits!
        </p>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.category}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm" role="img" aria-hidden="true">{row.emoji}</span>
                  <span className="text-sm font-bold text-foreground">
                    {row.label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-muted-fg">
                    {row.count}
                  </span>
                  <span className="text-xs text-muted-fg w-8 text-right">
                    {row.pct}%
                  </span>
                </div>
              </div>
              <div className="h-2.5 bg-muted rounded-full overflow-hidden clay-inset">
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
