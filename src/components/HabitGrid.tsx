'use client';

import { useMemo } from 'react';
import { HabitLog } from '@/lib/types';

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

interface HabitGridProps {
  logs: HabitLog[];
  habitCount: number;
}

export default function HabitGrid({ logs, habitCount }: HabitGridProps) {
  const gridData = useMemo(() => {
    const weeks: { date: string; level: number; count: number; total: number }[][] = [];
    const today = new Date();

    // Go back 12 weeks (84 days)
    for (let week = 11; week >= 0; week--) {
      const weekData: { date: string; level: number; count: number; total: number }[] = [];
      for (let day = 0; day < 7; day++) {
        const date = new Date(today);
        date.setDate(date.getDate() - (week * 7 + (6 - day)));
        const dateStr = formatDate(date);
        const count = logs.filter(l => l.date === dateStr && l.completed).length;
        const total = habitCount || 1;
        const ratio = count / total;
        let level = 0;
        if (count > 0) {
          if (ratio >= 1) level = 4;
          else if (ratio >= 0.75) level = 3;
          else if (ratio >= 0.5) level = 2;
          else level = 1;
        }
        weekData.push({ date: dateStr, level, count, total });
      }
      weeks.push(weekData);
    }

    return weeks;
  }, [logs, habitCount]);

  const levelColors = [
    'bg-muted',
    'bg-emerald-200 dark:bg-emerald-900',
    'bg-emerald-300 dark:bg-emerald-700',
    'bg-emerald-400 dark:bg-emerald-500',
    'bg-emerald-500 dark:bg-emerald-400',
  ];

  const dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading font-bold text-foreground">Activity</h3>
        <span className="pill bg-primary/15 text-primary">Last 12 weeks</span>
      </div>
      <div className="flex gap-1 overflow-x-auto pb-1">
        {/* Day labels */}
        <div className="flex flex-col gap-1 mr-2">
          {dayLabels.map((label, i) => (
            <div key={i} className="h-3 flex items-center">
              <span className="text-[10px] font-semibold text-muted-fg w-6">{label}</span>
            </div>
          ))}
        </div>
        {/* Grid */}
        {gridData.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((day, di) => (
              <div
                key={di}
                className={`w-3 h-3 rounded-md ${levelColors[day.level]} transition-colors cursor-default`}
                title={`${day.date}: ${day.count}/${day.total} habits`}
              />
            ))}
          </div>
        ))}
      </div>
      {/* Legend */}
      <div className="flex items-center justify-end gap-1 mt-3">
        <span className="text-[10px] font-semibold text-muted-fg mr-1">Less</span>
        {levelColors.map((color, i) => (
          <div key={i} className={`w-3 h-3 rounded-md ${color}`} aria-hidden="true" />
        ))}
        <span className="text-[10px] font-semibold text-muted-fg ml-1">More</span>
      </div>
    </div>
  );
}
