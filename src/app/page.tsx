'use client';

import { useState } from 'react';
import { Plus, Sparkles, ArrowRight, Zap } from 'lucide-react';
import { useHabits } from '@/hooks/useHabits';
import HabitCard from '@/components/HabitCard';
import StatsCards from '@/components/StatsCards';
import HabitGrid from '@/components/HabitGrid';
import AddHabitModal from '@/components/AddHabitModal';

export default function Dashboard() {
  const { habits, logs, isLoaded, addHabit, deleteHabit, toggleToday, overallStats } = useHabits();
  const [showAddModal, setShowAddModal] = useState(false);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading your habits...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-200"
        >
          <Plus className="w-5 h-5" />
          New Habit
        </button>
      </div>

      {/* Stats Cards */}
      <StatsCards stats={overallStats} />

      {/* Habit Grid */}
      <HabitGrid logs={logs} habitCount={habits.length} />

      {/* Habits List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Today&apos;s Habits
          </h2>
          {habits.length > 0 && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {habits.filter(h => h.todayCompleted).length}/{habits.length} done
            </span>
          )}
        </div>

        {habits.length === 0 ? (
          <EmptyState onAdd={() => setShowAddModal(true)} />
        ) : (
          <div className="grid gap-3 sm:gap-4">
            {habits.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                onToggle={toggleToday}
                onDelete={deleteHabit}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add Habit Modal */}
      <AddHabitModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={addHabit}
      />
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="text-center py-16 px-6 animate-fade-in">
      <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-950 dark:to-purple-950 rounded-2xl flex items-center justify-center mx-auto mb-6">
        <Sparkles className="w-10 h-10 text-indigo-500" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
        Start Forging Your Habits
      </h3>
      <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-8">
        Add your first habit and let AI help you build consistency. Small steps lead to big changes.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          onClick={onAdd}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all"
        >
          <Plus className="w-5 h-5" />
          Create Your First Habit
        </button>
        <a
          href="/coach"
          className="flex items-center gap-2 px-6 py-3 text-indigo-600 dark:text-indigo-400 font-medium hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-xl transition-colors"
        >
          <Zap className="w-4 h-4" />
          Ask AI for Suggestions
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
