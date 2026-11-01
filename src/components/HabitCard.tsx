'use client';

import { useState } from 'react';
import { Check, Flame, Trash2, MoreVertical, Pencil } from 'lucide-react';
import { HabitCategory, CATEGORY_CONFIG } from '@/lib/types';
import { Id } from '../../convex/_generated/dataModel';

interface HabitData {
  _id: Id<"habits">;
  name: string;
  description: string;
  category: HabitCategory;
  color: string;
  frequency: 'daily' | 'weekdays' | 'weekends' | 'custom';
  currentStreak: number;
  longestStreak: number;
  completionRate: number;
  todayCompleted: boolean;
  totalCompletions: number;
}

interface HabitCardProps {
  habit: HabitData;
  onToggle: (id: Id<"habits">) => void;
  onDelete: (id: Id<"habits">) => void;
  onEdit: (habit: HabitData) => void;
}

export default function HabitCard({ habit, onToggle, onDelete, onEdit }: HabitCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const config = CATEGORY_CONFIG[habit.category];

  const handleToggle = () => {
    setIsAnimating(true);
    onToggle(habit._id);
    setTimeout(() => setIsAnimating(false), 600);
  };

  return (
    <div
      className={`group relative card transition-all duration-300 overflow-hidden ${
        habit.todayCompleted ? 'ring-2 ring-primary/30' : 'hover:-translate-y-0.5'
      }`}
    >
      {/* Completion tint */}
      {habit.todayCompleted && (
        <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
      )}

      <div className="relative p-4 sm:p-5">
        <div className="flex items-start gap-4">
          {/* Toggle button */}
          <button
            onClick={handleToggle}
            aria-label={`Mark ${habit.name} as ${habit.todayCompleted ? 'not completed' : 'completed'}`}
            aria-pressed={habit.todayCompleted}
            className={`mt-0.5 flex-shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 ${
              habit.todayCompleted
                ? 'bg-primary text-on-primary shadow-[0_3px_0_var(--primary-edge),0_6px_12px_var(--clay-md)]'
                : 'bg-muted text-muted-fg clay-inset hover:text-primary'
            } ${isAnimating ? 'animate-bounce' : ''}`}
          >
            {habit.todayCompleted ? (
              <Check className="w-5 h-5" strokeWidth={3} aria-hidden="true" />
            ) : (
              <span className="w-4.5 h-4.5 rounded-lg border-2 border-current opacity-60" aria-hidden="true" />
            )}
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base" role="img" aria-label={config.label}>
                {config.emoji}
              </span>
              <h3
                className={`font-heading font-bold text-foreground truncate ${
                  habit.todayCompleted ? 'line-through text-muted-fg' : ''
                }`}
              >
                {habit.name}
              </h3>
            </div>
            {habit.description && (
              <p className="text-sm text-muted-fg mb-3 line-clamp-1">{habit.description}</p>
            )}

            {/* Stats row */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Streak */}
              <div className="flex items-center gap-1 text-sm">
                <Flame
                  className={`w-4 h-4 ${habit.currentStreak > 0 ? 'text-primary' : 'text-muted-fg'}`}
                  aria-hidden="true"
                />
                <span
                  className={`font-semibold ${
                    habit.currentStreak > 0 ? 'text-primary' : 'text-muted-fg'
                  }`}
                >
                  {habit.currentStreak}d streak
                </span>
              </div>

              {/* Completion rate */}
              <div className="flex items-center gap-1.5">
                <div
                  className="w-16 h-2 bg-muted rounded-full overflow-hidden clay-inset"
                  role="progressbar"
                  aria-valuenow={habit.completionRate}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${habit.name} completion rate`}
                >
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${habit.completionRate}%`,
                      backgroundColor: config.color,
                    }}
                  />
                </div>
                <span className="text-xs font-bold text-muted-fg">{habit.completionRate}%</span>
              </div>

              {/* Category badge */}
              <span
                className="pill text-white"
                style={{ backgroundColor: config.color }}
              >
                {config.label}
              </span>
            </div>
          </div>

          {/* Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              aria-label={`Actions for ${habit.name}`}
              aria-expanded={showMenu}
              aria-haspopup="menu"
              className="p-2 rounded-xl text-muted-fg hover:text-foreground hover:bg-muted opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all"
            >
              <MoreVertical className="w-4 h-4" aria-hidden="true" />
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div
                  role="menu"
                  className="absolute right-0 top-9 z-20 w-36 card rounded-2xl! py-1 overflow-hidden animate-scale-in"
                >
                  <button
                    role="menuitem"
                    onClick={() => {
                      onEdit(habit);
                      setShowMenu(false);
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    <Pencil className="w-4 h-4" aria-hidden="true" />
                    Edit
                  </button>
                  <button
                    role="menuitem"
                    onClick={() => {
                      onDelete(habit._id);
                      setShowMenu(false);
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
