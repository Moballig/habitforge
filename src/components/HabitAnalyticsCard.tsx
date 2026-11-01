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
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base">{config.emoji}</span>
          <h4 className="font-semibold text-gray-900 dark:text-white truncate">{habit.name}</h4>
        </div>
        <span
          className="flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium text-white"
          style={{ backgroundColor: config.color }}
        >
          {config.label}
        </span>
      </div>

      {/* Completion rate big number */}
      <div className="flex items-end gap-1 mb-3">
        <span className="text-3xl font-bold text-gray-900 dark:text-white">
          {habit.completionRate}%
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">completion rate</span>
      </div>
      <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-4">
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
        <div className="text-center p-2 rounded-xl bg-orange-50 dark:bg-orange-950/30">
          <Flame className="w-3.5 h-3.5 text-orange-500 mx-auto mb-1" />
          <p className="text-sm font-bold text-gray-900 dark:text-white">{habit.currentStreak}d</p>
          <p className="text-[10px] text-gray-500 dark:text-gray-400">current</p>
        </div>
        <div className="text-center p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/30">
          <TrendingUp className="w-3.5 h-3.5 text-indigo-500 mx-auto mb-1" />
          <p className="text-sm font-bold text-gray-900 dark:text-white">{habit.longestStreak}d</p>
          <p className="text-[10px] text-gray-500 dark:text-gray-400">longest</p>
        </div>
        <div className="text-center p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mx-auto mb-1" />
          <p className="text-sm font-bold text-gray-900 dark:text-white">
            {habit.totalCompletions}
          </p>
          <p className="text-[10px] text-gray-500 dark:text-gray-400">total</p>
        </div>
      </div>

      {/* Last 7 days mini strip */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3 text-gray-400 mr-0.5" />
          {last7.map((d, i) => (
            <div
              key={i}
              title={`${d.done ? 'Done' : 'Missed'}${d.isToday ? ' (today)' : ''}`}
              className={`w-4 h-4 rounded-sm ${
                d.done
                  ? 'bg-emerald-500'
                  : 'bg-gray-200 dark:bg-gray-700'
              } ${d.isToday && d.done ? 'ring-2 ring-emerald-300 dark:ring-emerald-700' : ''}`}
            />
          ))}
        </div>
        <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">
          {last7Done}/7 this week
        </span>
      </div>
    </div>
  );
}
