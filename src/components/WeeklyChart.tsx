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
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          7-Day Completion Trend
        </h3>
        <span className="text-xs font-medium px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
          avg {avg}%
        </span>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
        Percentage of habits completed each day
      </p>

      <div className="flex items-end justify-between gap-2 h-36">
        {data.map((pct, i) => {
          const label = labels[i];
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
              <span
                className={`text-[10px] font-semibold ${
                  label?.isToday
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-400 dark:text-gray-500'
                }`}
              >
                {pct}%
              </span>
              <div className="w-full h-full flex items-end">
                <div
                  className={`w-full rounded-t-md transition-all duration-700 ${
                    label?.isToday
                      ? 'bg-gradient-to-t from-indigo-500 to-purple-500 shadow-md shadow-indigo-500/20'
                      : 'bg-gradient-to-t from-indigo-300 to-purple-300 dark:from-indigo-800 dark:to-purple-800'
                  }`}
                  style={{ height: `${Math.max(pct, 3)}%` }}
                  title={`${pct}% complete`}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between gap-2 mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
        {labels.map((l, i) => (
          <span
            key={i}
            className={`flex-1 text-center text-[10px] font-medium ${
              l.isToday
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-gray-400 dark:text-gray-500'
            }`}
          >
            {l.label}
          </span>
        ))}
      </div>
    </div>
  );
}
