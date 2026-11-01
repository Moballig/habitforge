'use client';

import { useMemo } from 'react';

interface WeeklyChartProps {
  data: number[]; // 7 completion-rate percentages, oldest → newest
}

export default function WeeklyChart({ data }: WeeklyChartProps) {
  const labels = useMemo(() => {
    const out: { label: string; isToday: boolean }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      out.push({
        label: d.toLocaleDateString('en-US', { weekday: 'short' }),
        isToday: i === 0,
      });
    }
    return out;
  }, []);

  const avg = data.length > 0 ? Math.round(data.reduce((a, b) => a + b, 0) / data.length) : 0;

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-heading font-bold text-foreground">7-Day Completion Trend</h3>
        <span className="pill bg-primary/15 text-primary">avg {avg}%</span>
      </div>
      <p className="text-xs text-muted-fg mb-4">
        Percentage of habits completed each day
      </p>

      <div className="flex items-end justify-between gap-2 h-36">
        {data.map((pct, i) => {
          const label = labels[i];
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
              <span
                className={`text-[10px] font-bold ${
                  label?.isToday ? 'text-primary' : 'text-muted-fg'
                }`}
              >
                {pct}%
              </span>
              <div className="w-full h-full flex items-end">
                <div
                  className={`w-full rounded-t-xl transition-all duration-700 ${
                    label?.isToday
                      ? 'bg-primary'
                      : 'bg-primary/25 dark:bg-primary/20'
                  }`}
                  style={{ height: `${Math.max(pct, 3)}%` }}
                  title={`${pct}% complete`}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between gap-2 mt-2 pt-2 border-t border-border">
        {labels.map((l, i) => (
          <span
            key={i}
            className={`flex-1 text-center text-[10px] font-bold ${
              l.isToday ? 'text-primary' : 'text-muted-fg'
            }`}
          >
            {l.label}
          </span>
        ))}
      </div>
    </div>
  );
}
