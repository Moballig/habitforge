'use client';

import { useMemo } from 'react';
import { Flame, TrendingUp, CheckCircle2, Calendar } from 'lucide-react';
import { HabitCategory, CATEGORY_CONFIG } from '@/lib/types';

interface HabitAnalyticsCardProps {
  habit: {
    name: string;
    category: HabitCategory;
    currentStreak: number;
    longestStreak: number;
    completionRate: number;
    totalCompletions: number;
  };
  logs: Array<{ habitId: string; date: string; completed: boolean }>;
  habitId: string;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export default function HabitAnalyticsCard({ habit, logs, habitId }: HabitAnalyticsCardProps) {
  const config = CATEGORY_CONFIG[habit.category];

  const last7 = useMemo(() => {
    const out: { label: string; done: boolean; isToday: boolean }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = formatDate(d);
      out.push({
        label: d.toLocaleDateString('en-US', { weekday: 'narrow' }),
        done: logs.some((l) => l.habitId === habitId && l.date === dateStr && l.completed),
        isToday: i === 0,
      });
    }
    return out;
  }, [logs, habitId]);

  const last7Done = last7.filter((d) => d.done).length;

  return (
    <div className="card p-5 transition-all duration-200 hover:-translate-y-0.5">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base" role="img" aria-label={config.label}>{config.emoji}</span>
          <h4 className="font-heading font-bold text-foreground truncate">{habit.name}</h4>
        </div>
        <span
          className="flex-shrink-0 pill text-white"
          style={{ backgroundColor: config.color }}
        >
          {config.label}
        </span>
      </div>

      {/* Completion rate big number */}
      <div className="flex items-end gap-1 mb-3">
        <span className="text-3xl font-heading font-bold text-foreground">
          {habit.completionRate}%
        </span>
        <span className="text-xs text-muted-fg mb-1">completion rate</span>
      </div>
      <div
        className="h-2 bg-muted rounded-full overflow-hidden clay-inset mb-4"
        role="progressbar"
        aria-valuenow={habit.completionRate}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${habit.name} completion rate`}
      >
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${habit.completionRate}%`,
            backgroundColor: config.color,
          }}
        />
      </div>

      {/* Stats rows */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center p-2.5 rounded-2xl bg-amber-100/70 dark:bg-amber-950/30 clay-sm">
          <Flame className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 mx-auto mb-1" aria-hidden="true" />
          <p className="text-sm font-heading font-bold text-foreground">{habit.currentStreak}d</p>
          <p className="text-[10px] text-muted-fg">current</p>
        </div>
        <div className="text-center p-2.5 rounded-2xl bg-primary/10 clay-sm">
          <TrendingUp className="w-3.5 h-3.5 text-primary mx-auto mb-1" aria-hidden="true" />
          <p className="text-sm font-heading font-bold text-foreground">{habit.longestStreak}d</p>
          <p className="text-[10px] text-muted-fg">longest</p>
        </div>
        <div className="text-center p-2.5 rounded-2xl bg-emerald-100/70 dark:bg-emerald-950/30 clay-sm">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 mx-auto mb-1" aria-hidden="true" />
          <p className="text-sm font-heading font-bold text-foreground">
            {habit.totalCompletions}
          </p>
          <p className="text-[10px] text-muted-fg">total</p>
        </div>
      </div>

      {/* Last 7 days mini strip */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3 text-muted-fg mr-0.5" aria-hidden="true" />
          {last7.map((d, i) => (
            <div
              key={i}
              title={`${d.done ? 'Done' : 'Missed'}${d.isToday ? ' (today)' : ''}`}
              className={`w-4 h-4 rounded-md ${
                d.done
                  ? 'bg-emerald-500'
                  : 'bg-muted'
              } ${d.isToday && d.done ? 'ring-2 ring-emerald-300 dark:ring-emerald-700' : ''}`}
            />
          ))}
        </div>
        <span className="text-[10px] font-bold text-muted-fg">
          {last7Done}/7 this week
        </span>
      </div>
    </div>
  );
}
