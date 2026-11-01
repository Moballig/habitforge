import { Habit, HabitLog } from './types';

const HABITS_KEY = 'habitforge_habits';
const LOGS_KEY = 'habitforge_logs';

export function getHabits(): Habit[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(HABITS_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveHabits(habits: Habit[]): void {
  localStorage.setItem(HABITS_KEY, JSON.stringify(habits));
}

export function addHabit(habit: Habit): void {
  const habits = getHabits();
  habits.push(habit);
  saveHabits(habits);
}

export function updateHabit(id: string, updates: Partial<Habit>): void {
  const habits = getHabits();
  const index = habits.findIndex(h => h.id === id);
  if (index !== -1) {
    habits[index] = { ...habits[index], ...updates };
    saveHabits(habits);
  }
}

export function deleteHabit(id: string): void {
  const habits = getHabits().filter(h => h.id !== id);
  saveHabits(habits);
  // Also delete associated logs
  const logs = getLogs().filter(l => l.habitId !== id);
  saveLogs(logs);
}

export function getLogs(): HabitLog[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(LOGS_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveLogs(logs: HabitLog[]): void {
  localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
}

export function toggleHabitLog(habitId: string, date: string): boolean {
  const logs = getLogs();
  const existingIndex = logs.findIndex(l => l.habitId === habitId && l.date === date);
  
  if (existingIndex !== -1) {
    // Toggle off
    logs.splice(existingIndex, 1);
    saveLogs(logs);
    return false;
  } else {
    // Toggle on
    logs.push({ habitId, date, completed: true });
    saveLogs(logs);
    return true;
  }
}

export function isHabitCompletedOnDate(habitId: string, date: string, logs: HabitLog[]): boolean {
  return logs.some(l => l.habitId === habitId && l.date === date && l.completed);
}

export function getHabitLogsForDate(date: string): HabitLog[] {
  return getLogs().filter(l => l.date === date);
}

// Generate a unique ID
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Format date to YYYY-MM-DD
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Get today's date as YYYY-MM-DD
export function getToday(): string {
  return formatDate(new Date());
}
