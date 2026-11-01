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
          <h1 className="text-3xl sm:text-4xl font-heading font-bold text-foreground">
            Dashboard
          </h1>
          <p className="text-sm text-muted-fg mt-1">
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
          className="btn btn-primary px-5 py-3 text-sm"
        >
          <Plus className="w-5 h-5" aria-hidden="true" />
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
          <h2 className="text-xl font-heading font-bold text-foreground">
            Today&apos;s Habits
          </h2>
          {habits.length > 0 && (
            <span className="pill bg-accent/15 text-accent">
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
          <div className="h-9 w-48 bg-muted rounded-2xl" />
          <div className="h-4 w-64 bg-muted rounded-full" />
        </div>
        <div className="h-12 w-36 bg-muted rounded-2xl" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 bg-muted rounded-3xl" />
        ))}
      </div>

      {/* Grid card */}
      <div className="h-48 bg-muted rounded-3xl" />

      {/* List */}
      <div className="space-y-3 sm:space-y-4">
        <div className="h-6 w-36 bg-muted rounded-full" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 bg-muted rounded-3xl" />
        ))}
      </div>
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="text-center py-16 px-6 card animate-fade-in">
      <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-950/50 dark:to-orange-950/50 rounded-3xl flex items-center justify-center mx-auto mb-6 clay-sm">
        <Sparkles className="w-10 h-10 text-primary" aria-hidden="true" />
      </div>
      <h3 className="text-2xl font-heading font-bold text-foreground mb-2">
        Start Forging Your Habits
      </h3>
      <p className="text-muted-fg max-w-sm mx-auto mb-8">
        Add your first habit and let AI help you build consistency. Small steps lead to big changes.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button onClick={onAdd} className="btn btn-primary px-6 py-3">
          <Plus className="w-5 h-5" aria-hidden="true" />
          Create Your First Habit
        </button>
        <a
          href="/coach"
          className="btn btn-soft px-6 py-3 text-primary"
        >
          <Zap className="w-4 h-4" aria-hidden="true" />
          Ask AI for Suggestions
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}
