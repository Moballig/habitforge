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
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md card overflow-hidden animate-scale-in max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-hi to-primary flex items-center justify-center clay-sm">
              <Pencil className="w-4.5 h-4.5 text-on-primary" aria-hidden="true" />
            </div>
            <h2 id="edit-habit-title" className="text-lg font-heading font-bold text-foreground">
              Edit Habit
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close edit dialog"
            className="btn-ghost p-2 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Name */}
          <div>
            <label htmlFor="edit-habit-name" className="block text-sm font-bold text-foreground mb-2">
              Habit Name *
            </label>
            <input
              id="edit-habit-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Drink 8 glasses of water"
              className="input"
              autoFocus
              required
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="edit-habit-desc" className="block text-sm font-bold text-foreground mb-2">
              Description
            </label>
            <textarea
              id="edit-habit-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Why is this habit important to you?"
              rows={2}
              className="input resize-none"
            />
          </div>

          {/* Category */}
          <div>
            <span className="block text-sm font-bold text-foreground mb-2">Category</span>
            <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="Habit category">
              {(Object.entries(CATEGORY_CONFIG) as [HabitCategory, typeof CATEGORY_CONFIG[HabitCategory]][]).map(
                ([key, { label, emoji }]) => (
                  <button
                    key={key}
                    type="button"
                    role="radio"
                    aria-checked={category === key}
                    onClick={() => setCategory(key)}
                    className={`flex flex-col items-center gap-1 p-2.5 rounded-2xl border-2 transition-all text-xs ${
                      category === key
                        ? 'border-primary bg-primary/10 text-foreground clay-sm'
                        : 'border-border text-muted-fg hover:border-primary/40 hover:text-foreground'
                    }`}
                  >
                    <span className="text-lg" role="img" aria-hidden="true">{emoji}</span>
                    <span className="font-bold">{label}</span>
                  </button>
                )
              )}
            </div>
          </div>

          {/* Frequency */}
          <div>
            <span className="block text-sm font-bold text-foreground mb-2">Frequency</span>
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
                  className={`flex-1 px-3 py-2.5 rounded-2xl border-2 text-sm font-bold transition-all ${
                    frequency === value
                      ? 'border-primary bg-primary/10 text-primary clay-sm'
                      : 'border-border text-muted-fg hover:border-primary/40'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn btn-soft flex-1 py-3.5">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary flex-1 py-3.5">
              <Save className="w-4.5 h-4.5" aria-hidden="true" />
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
