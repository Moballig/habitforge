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
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    },
    {
      label: 'Best Streak',
      value: `${stats.bestStreak}d`,
      subtitle: stats.bestStreakHabit || 'No streaks yet',
      icon: Flame,
      color: 'from-orange-500 to-red-500',
      bgColor: 'bg-orange-50 dark:bg-orange-950/30',
    },
    {
      label: 'Total Check-ins',
      value: stats.totalCompletions.toString(),
      subtitle: 'All time',
      icon: TrendingUp,
      color: 'from-emerald-500 to-teal-500',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    },
    {
      label: 'Active Habits',
      value: stats.totalHabits.toString(),
      subtitle: 'Being tracked',
      icon: Award,
      color: 'from-purple-500 to-indigo-500',
      bgColor: 'bg-purple-50 dark:bg-purple-950/30',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`${card.bgColor} rounded-2xl p-4 sm:p-5 border border-gray-200/50 dark:border-gray-700/50`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              {card.label}
            </span>
            <div className={`w-8 h-8 bg-gradient-to-br ${card.color} rounded-lg flex items-center justify-center`}>
              <card.icon className="w-4 h-4 text-white" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{card.value}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">{card.subtitle}</p>
        </div>
      ))}
    </div>
  );
}
