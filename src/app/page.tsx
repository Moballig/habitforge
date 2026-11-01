'use client';

import { useEffect, useRef, useState } from 'react';
import { Plus, Sparkles, ArrowRight, Zap } from 'lucide-react';
import { useHabits } from '@/hooks/useHabits';
import HabitCard from '@/components/HabitCard';
import StatsCards from '@/components/StatsCards';
import HabitGrid from '@/components/HabitGrid';
import AddHabitModal from '@/components/AddHabitModal';
import EditHabitModal from '@/components/EditHabitModal';
import Confetti from '@/components/Confetti';
import { useToast } from '@/components/Toast';

export default function Dashboard() {
  const { habits, logs, isLoaded, addHabit, updateHabit, deleteHabit, toggleToday, overallStats } =
    useHabits();
  const { toast } = useToast();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingHabit, setEditingHabit] = useState<{
    _id: (typeof habits)[number]['_id'];
    name: string;
    description: string;
    category: (typeof habits)[number]['category'];
    frequency: (typeof habits)[number]['frequency'];
  } | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  // Celebrate when all daily habits get completed (transition only, not on load)
  const allDone = habits.length > 0 && overallStats.todayCompletions === habits.length;
  const prevAllDone = useRef<boolean | null>(null);
  useEffect(() => {
    if (!isLoaded) return;
    if (prevAllDone.current === false && allDone) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3200);
      prevAllDone.current = allDone;
      return () => clearTimeout(timer);
    }
    prevAllDone.current = allDone;
  }, [isLoaded, allDone]);

  if (!isLoaded) {
    return <DashboardSkeleton />;
  }

  // Normalize logs for HabitGrid
  const gridLogs = logs.map((l) => ({
    habitId: (l.habitId ?? l._id) as string,
    date: l.date,
    completed: l.completed,
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {showConfetti && <Confetti />}

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
      <HabitGrid logs={gridLogs} habitCount={habits.length} />

      {/* Habits List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Today&apos;s Habits
          </h2>
          {habits.length > 0 && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {habits.filter((h) => h.todayCompleted).length}/{habits.length} done
            </span>
          )}
        </div>

        {habits.length === 0 ? (
          <EmptyState onAdd={() => setShowAddModal(true)} />
        ) : (
          <div className="grid gap-3 sm:gap-4">
            {habits.map((habit) => (
              <HabitCard
                key={habit._id}
                habit={habit}
                onToggle={toggleToday}
                onDelete={async (id) => {
                  await deleteHabit(id);
                  toast('Habit deleted');
                }}
                onEdit={(h) =>
                  setEditingHabit({
                    _id: h._id,
                    name: h.name,
                    description: h.description,
                    category: h.category,
                    frequency: h.frequency,
                  })
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* Add Habit Modal */}
      <AddHabitModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={async (habit) => {
          await addHabit(habit);
          toast('Habit created — keep it up!');
        }}
      />

      {/* Edit Habit Modal */}
      {editingHabit && (
        <EditHabitModal
          habit={editingHabit}
          onClose={() => setEditingHabit(null)}
          onSave={async (updates) => {
            await updateHabit(editingHabit._id, updates);
            toast('Habit updated');
          }}
        />
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 animate-pulse"
      aria-busy="true"
      aria-label="Loading dashboard"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-44 bg-gray-200 dark:bg-gray-800 rounded-lg" />
          <div className="h-4 w-64 bg-gray-200 dark:bg-gray-800 rounded-md" />
        </div>
        <div className="h-11 w-36 bg-gray-200 dark:bg-gray-800 rounded-xl" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
        ))}
      </div>

      {/* Grid card */}
      <div className="h-48 bg-gray-200 dark:bg-gray-800 rounded-2xl" />

      {/* List */}
      <div className="space-y-3 sm:space-y-4">
        <div className="h-6 w-36 bg-gray-200 dark:bg-gray-800 rounded-md" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
        ))}
      </div>
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
