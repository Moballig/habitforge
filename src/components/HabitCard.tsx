'use client';

import { useState } from 'react';
import { Check, Flame, Trash2, MoreVertical } from 'lucide-react';
import { HabitCategory, CATEGORY_CONFIG } from '@/lib/types';
import { Id } from '../../../convex/_generated/dataModel';

interface HabitData {
  _id: Id<"habits">;
  name: string;
  description: string;
  category: HabitCategory;
  color: string;
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
}

export default function HabitCard({ habit, onToggle, onDelete }: HabitCardProps) {
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
      className={`group relative bg-white dark:bg-gray-900 rounded-2xl border-2 transition-all duration-300 overflow-hidden ${
        habit.todayCompleted
          ? 'border-green-300 dark:border-green-700 shadow-lg shadow-green-500/10'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md'
      }`}
    >
      {/* Completion glow effect */}
      {habit.todayCompleted && (
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30" />
      )}

      <div className="relative p-4 sm:p-5">
        <div className="flex items-start gap-4">
          {/* Toggle button */}
          <button
            onClick={handleToggle}
            className={`mt-0.5 flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
              habit.todayCompleted
                ? 'bg-green-500 text-white shadow-lg shadow-green-500/30 scale-105'
                : 'border-2 border-gray-300 dark:border-gray-600 hover:border-indigo-500 dark:hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30'
            } ${isAnimating ? 'animate-bounce' : ''}`}
          >
            {habit.todayCompleted && <Check className="w-5 h-5" strokeWidth={3} />}
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">{config.emoji}</span>
              <h3 className={`font-semibold text-gray-900 dark:text-white truncate ${
                habit.todayCompleted ? 'line-through text-gray-500 dark:text-gray-400' : ''
              }`}>
                {habit.name}
              </h3>
            </div>
            {habit.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-1">
                {habit.description}
              </p>
            )}

            {/* Stats row */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Streak */}
              <div className="flex items-center gap-1 text-sm">
                <Flame className={`w-4 h-4 ${habit.currentStreak > 0 ? 'text-orange-500' : 'text-gray-400'}`} />
                <span className={`font-medium ${habit.currentStreak > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-gray-500'}`}>
                  {habit.currentStreak}d streak
                </span>
              </div>

              {/* Completion rate */}
              <div className="flex items-center gap-1.5">
                <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${habit.completionRate}%`,
                      backgroundColor: config.color,
                    }}
                  />
                </div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {habit.completionRate}%
                </span>
              </div>

              {/* Category badge */}
              <span
                className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
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
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 opacity-0 group-hover:opacity-100 transition-all"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-8 z-20 w-36 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-1 overflow-hidden">
                  <button
                    onClick={() => {
                      onDelete(habit._id);
                      setShowMenu(false);
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
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
