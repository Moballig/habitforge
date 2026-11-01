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
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-fg font-medium">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (habits.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="text-center py-20 card animate-fade-in">
          <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-950/50 dark:to-orange-950/50 rounded-3xl flex items-center justify-center mx-auto mb-6 clay-sm">
            <BarChart3 className="w-10 h-10 text-primary" aria-hidden="true" />
          </div>
          <h2 className="text-2xl font-heading font-bold text-foreground mb-2">
            No data to analyze yet
          </h2>
          <p className="text-muted-fg max-w-sm mx-auto mb-8">
            Add a few habits and check them off — your analytics will appear here automatically.
          </p>
          <Link href="/" className="btn btn-primary px-6 py-3">
            <Plus className="w-5 h-5" aria-hidden="true" />
            Create Your First Habit
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-heading font-bold text-foreground">
          Analytics
        </h1>
        <p className="text-sm text-muted-fg mt-1">
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
        <h2 className="text-xl font-heading font-bold text-foreground mb-4">
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
