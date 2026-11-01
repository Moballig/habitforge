'use client';

import { Target, Flame, TrendingUp, Award } from 'lucide-react';

interface StatsCardsProps {
  stats: {
    totalHabits: number;
    todayCompletions: number;
    todayTotal: number;
    todayRate: number;
    totalCompletions: number;
    bestStreak: number;
    bestStreakHabit: string;
  };
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      label: "Today's Progress",
      value: `${stats.todayCompletions}/${stats.todayTotal}`,
      subtitle: `${stats.todayRate}% complete`,
      icon: Target,
      iconBg: 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'Best Streak',
      value: `${stats.bestStreak}d`,
      subtitle: stats.bestStreakHabit || 'No streaks yet',
      icon: Flame,
      iconBg: 'bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400',
    },
    {
      label: 'Total Check-ins',
      value: stats.totalCompletions.toString(),
      subtitle: 'All time',
      icon: TrendingUp,
      iconBg: 'bg-primary/15 text-primary',
    },
    {
      label: 'Active Habits',
      value: stats.totalHabits.toString(),
      subtitle: 'Being tracked',
      icon: Award,
      iconBg: 'bg-rose-100 dark:bg-rose-950/50 text-rose-500 dark:text-rose-400',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((card) => (
        <div key={card.label} className="card p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-muted-fg uppercase tracking-wider">
              {card.label}
            </span>
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center clay-sm ${card.iconBg}`}
            >
              <card.icon className="w-4.5 h-4.5" aria-hidden="true" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-heading font-bold text-foreground">{card.value}</p>
          <p className="text-xs text-muted-fg mt-1 truncate">{card.subtitle}</p>
        </div>
      ))}
    </div>
  );
}
