'use client';

import { useState, useEffect, useCallback } from 'react';
import { Habit, HabitLog, HabitWithStats } from '@/lib/types';
import { getHabits, saveHabits, getLogs, saveLogs, toggleHabitLog, generateId, getToday } from '@/lib/storage';
import { getHabitWithStats, getOverallStats } from '@/lib/analytics';

export function useHabits() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setHabits(getHabits());
    setLogs(getLogs());
    setIsLoaded(true);
  }, []);

  const addHabit = useCallback((habit: Omit<Habit, 'id' | 'createdAt' | 'archived'>) => {
    const newHabit: Habit = {
      ...habit,
      id: generateId(),
      createdAt: new Date().toISOString(),
      archived: false,
    };
    const updated = [...habits, newHabit];
    setHabits(updated);
    saveHabits(updated);
    return newHabit;
  }, [habits]);

  const updateHabit = useCallback((id: string, updates: Partial<Habit>) => {
    const updated = habits.map(h => h.id === id ? { ...h, ...updates } : h);
    setHabits(updated);
    saveHabits(updated);
  }, [habits]);

  const deleteHabit = useCallback((id: string) => {
    const updatedHabits = habits.filter(h => h.id !== id);
    const updatedLogs = logs.filter(l => l.habitId !== id);
    setHabits(updatedHabits);
    setLogs(updatedLogs);
    saveHabits(updatedHabits);
    saveLogs(updatedLogs);
  }, [habits, logs]);

  const toggleToday = useCallback((habitId: string) => {
    const today = getToday();
    const completed = toggleHabitLog(habitId, today);
    setLogs(getLogs()); // Refresh logs from storage
    return completed;
  }, []);

  const habitsWithStats: HabitWithStats[] = habits
    .filter(h => !h.archived)
    .map(h => getHabitWithStats(h, logs));

  const overallStats = getOverallStats(habits, logs);

  return {
    habits: habitsWithStats,
    allHabits: habits,
    logs,
    isLoaded,
    addHabit,
    updateHabit,
    deleteHabit,
    toggleToday,
    overallStats,
  };
}
