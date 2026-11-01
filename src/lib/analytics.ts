import { Habit, HabitLog, HabitWithStats } from './types';
import { formatDate, isHabitCompletedOnDate, getToday } from './storage';

export function calculateStreak(habitId: string, logs: HabitLog[]): { current: number; longest: number } {
  const habitLogs = logs
    .filter(l => l.habitId === habitId && l.completed)
    .map(l => l.date)
    .sort()
    .reverse();

  if (habitLogs.length === 0) return { current: 0, longest: 0 };

  // Calculate current streak (counting backwards from today)
  let currentStreak = 0;
  const today = new Date();
  const checkDate = new Date(today);
  
  // Check if today is done
  const todayStr = formatDate(today);
  const todayDone = habitLogs.includes(todayStr);
  
  if (!todayDone) {
    // Check yesterday - if yesterday isn't done either, streak is 0
    checkDate.setDate(checkDate.getDate() - 1);
    const yesterdayStr = formatDate(checkDate);
    if (!habitLogs.includes(yesterdayStr)) {
      // Calculate longest streak separately
      return { current: 0, longest: calculateLongestStreak(habitLogs) };
    }
  }

  // Count backwards
  const startDate = todayDone ? new Date(today) : new Date(checkDate);
  const iterDate = new Date(startDate);
  
  while (habitLogs.includes(formatDate(iterDate))) {
    currentStreak++;
    iterDate.setDate(iterDate.getDate() - 1);
  }

  const longest = Math.max(currentStreak, calculateLongestStreak(habitLogs));

  return { current: currentStreak, longest };
}

function calculateLongestStreak(sortedDates: string[]): number {
  if (sortedDates.length === 0) return 0;
  
  const sorted = [...sortedDates].sort();
  let longest = 1;
  let current = 1;

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays === 1) {
      current++;
      longest = Math.max(longest, current);
    } else if (diffDays > 1) {
      current = 1;
    }
  }

  return longest;
}

export function calculateCompletionRate(habitId: string, logs: HabitLog[], since: Date): number {
  const today = new Date();
  const totalDays = Math.max(1, Math.ceil((today.getTime() - since.getTime()) / (1000 * 60 * 60 * 24)));
  const completedDays = logs.filter(l => l.habitId === habitId && l.completed).length;
  return Math.round((completedDays / totalDays) * 100);
}

export function getHabitWithStats(habit: Habit, logs: HabitLog[]): HabitWithStats {
  const streak = calculateStreak(habit.id, logs);
  const completionRate = calculateCompletionRate(habit.id, logs, new Date(habit.createdAt));
  const todayCompleted = isHabitCompletedOnDate(habit.id, getToday(), logs);
  const totalCompletions = logs.filter(l => l.habitId === habit.id && l.completed).length;

  return {
    ...habit,
    currentStreak: streak.current,
    longestStreak: streak.longest,
    completionRate,
    todayCompleted,
    totalCompletions,
  };
}

export function getOverallStats(habits: Habit[], logs: HabitLog[]) {
  const today = getToday();
  const activeHabits = habits.filter(h => !h.archived);
  const todayCompletions = activeHabits.filter(h => 
    isHabitCompletedOnDate(h.id, today, logs)
  ).length;

  const totalCompletions = logs.filter(l => l.completed).length;
  
  // Last 7 days completion rate
  const last7Days: number[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = formatDate(date);
    const completed = activeHabits.filter(h => isHabitCompletedOnDate(h.id, dateStr, logs)).length;
    last7Days.push(activeHabits.length > 0 ? Math.round((completed / activeHabits.length) * 100) : 0);
  }

  // Best streak across all habits
  let bestStreak = 0;
  let bestStreakHabit = '';
  activeHabits.forEach(h => {
    const streak = calculateStreak(h.id, logs);
    if (streak.current > bestStreak) {
      bestStreak = streak.current;
      bestStreakHabit = h.name;
    }
  });

  return {
    totalHabits: activeHabits.length,
    todayCompletions,
    todayTotal: activeHabits.length,
    todayRate: activeHabits.length > 0 ? Math.round((todayCompletions / activeHabits.length) * 100) : 0,
    totalCompletions,
    last7Days,
    bestStreak,
    bestStreakHabit,
  };
}

export function getLast7DaysLabels(): string[] {
  const labels: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
  }
  return labels;
}
