'use client';

import Link from 'next/link';
import { BarChart3, ArrowRight, Plus } from 'lucide-react';
import { useHabits } from '@/hooks/useHabits';
import StatsCards from '@/components/StatsCards';
import WeeklyChart from '@/components/WeeklyChart';
import CategoryChart from '@/components/CategoryChart';
import HabitAnalyticsCard from '@/components/HabitAnalyticsCard';
import AIReport from '@/components/AIReport';

export default function AnalyticsPage() {
  const { habits, logs, overallStats, isLoaded } = useHabits();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (habits.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="text-center py-20 animate-fade-in">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-950 dark:to-purple-950 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <BarChart3 className="w-10 h-10 text-indigo-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            No data to analyze yet
          </h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-8">
            Add a few habits and check them off — your analytics will appear here automatically.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-500/25 transition-all"
          >
            <Plus className="w-5 h-5" />
            Create Your First Habit
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Analytics
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Understand your patterns and let AI guide your next week
        </p>
      </div>

      {/* Overview stats */}
      <StatsCards stats={overallStats} />

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WeeklyChart data={overallStats.last7Days} />
        <CategoryChart habits={habits} />
      </div>

      {/* AI Weekly Report */}
      <AIReport habits={habits} logs={logs} />

      {/* Per-habit breakdown */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Per-Habit Breakdown
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {habits.map((habit) => (
            <HabitAnalyticsCard
              key={habit._id}
              habit={habit}
              habitId={habit._id as string}
              logs={logs.map((l) => ({
                habitId: (l.habitId ?? l._id) as string,
                date: l.date,
                completed: l.completed,
              }))}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
