'use client';

import { useEffect, useState } from 'react';
import { X, Save, Pencil } from 'lucide-react';
import { HabitCategory, CATEGORY_CONFIG } from '@/lib/types';

export interface EditableHabit {
  name: string;
  description: string;
  category: HabitCategory;
  frequency: 'daily' | 'weekdays' | 'weekends' | 'custom';
}

interface EditHabitModalProps {
  habit: EditableHabit;
  onClose: () => void;
  onSave: (updates: EditableHabit & { color: string }) => void;
}

export default function EditHabitModal({ habit, onClose, onSave }: EditHabitModalProps) {
  const [name, setName] = useState(habit.name);
  const [description, setDescription] = useState(habit.description);
  const [category, setCategory] = useState<HabitCategory>(habit.category);
  const [frequency, setFrequency] = useState<typeof habit.frequency>(habit.frequency);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      description: description.trim(),
      category,
      color: CATEGORY_CONFIG[category].color,
      frequency,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="edit-habit-title">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-scale-in max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
              <Pencil className="w-4 h-4 text-white" />
            </div>
            <h2 id="edit-habit-title" className="text-lg font-semibold text-gray-900 dark:text-white">
              Edit Habit
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close edit dialog"
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Name */}
          <div>
            <label htmlFor="edit-habit-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Habit Name *
            </label>
            <input
              id="edit-habit-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Drink 8 glasses of water"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              autoFocus
              required
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="edit-habit-desc" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              id="edit-habit-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Why is this habit important to you?"
              rows={2}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none"
            />
          </div>

          {/* Category */}
          <div>
            <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category
            </span>
            <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="Habit category">
              {(Object.entries(CATEGORY_CONFIG) as [HabitCategory, typeof CATEGORY_CONFIG[HabitCategory]][]).map(
                ([key, { label, emoji }]) => (
                  <button
                    key={key}
                    type="button"
                    role="radio"
                    aria-checked={category === key}
                    onClick={() => setCategory(key)}
                    className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition-all text-xs ${
                      category === key
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 shadow-sm'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <span className="text-lg">{emoji}</span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">{label}</span>
                  </button>
                )
              )}
            </div>
          </div>

          {/* Frequency */}
          <div>
            <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Frequency
            </span>
            <div className="flex gap-2" role="radiogroup" aria-label="Habit frequency">
              {[
                { value: 'daily', label: 'Daily' },
                { value: 'weekdays', label: 'Weekdays' },
                { value: 'weekends', label: 'Weekends' },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={frequency === value}
                  onClick={() => setFrequency(value as typeof frequency)}
                  className={`flex-1 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                    frequency === value
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400'
                      : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-semibold rounded-xl hover:from-amber-500 hover:to-orange-600 shadow-lg shadow-orange-500/25 transition-all duration-200"
            >
              <Save className="w-4.5 h-4.5" />
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
