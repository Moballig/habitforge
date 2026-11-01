'use client';

import { useState } from 'react';
import { X, Plus, Sparkles } from 'lucide-react';
import { HabitCategory, CATEGORY_CONFIG } from '@/lib/types';

interface AddHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (habit: {
    name: string;
    description: string;
    category: HabitCategory;
    color: string;
    frequency: 'daily' | 'weekdays' | 'weekends' | 'custom';
  }) => void;
}

export default function AddHabitModal({ isOpen, onClose, onAdd }: AddHabitModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<HabitCategory>('health');
  const [frequency, setFrequency] = useState<'daily' | 'weekdays' | 'weekends' | 'custom'>('daily');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAdd({
      name: name.trim(),
      description: description.trim(),
      category,
      color: CATEGORY_CONFIG[category].color,
      frequency,
    });

    // Reset
    setName('');
    setDescription('');
    setCategory('health');
    setFrequency('daily');
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-habit-title"
      onKeyDown={handleKeyDown}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md card overflow-hidden animate-scale-in max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center clay-sm">
              <Sparkles className="w-4.5 h-4.5 text-on-primary" aria-hidden="true" />
            </div>
            <h2 id="add-habit-title" className="text-lg font-heading font-bold text-foreground">
              New Habit
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="btn-ghost p-2 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Name */}
          <div>
            <label htmlFor="add-habit-name" className="block text-sm font-bold text-foreground mb-2">
              Habit Name *
            </label>
            <input
              id="add-habit-name"
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
            <label htmlFor="add-habit-desc" className="block text-sm font-bold text-foreground mb-2">
              Description
            </label>
            <textarea
              id="add-habit-desc"
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
          <button type="submit" className="btn btn-primary w-full py-3.5">
            <Plus className="w-5 h-5" aria-hidden="true" />
            Create Habit
          </button>
        </form>
      </div>
    </div>
  );
}
