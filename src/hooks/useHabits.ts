"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { HabitCategory, CATEGORY_CONFIG } from "@/lib/types";
import { Id } from "../../convex/_generated/dataModel";

// Format date to YYYY-MM-DD
function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function getToday(): string {
  return formatDate(new Date());
}

// Calculate streak from logs
function calculateStreak(
  habitId: string,
  logs: Array<{ habitId: string; date: string; completed: boolean }>
): { current: number; longest: number } {
  const habitLogs = logs
    .filter((l) => l.habitId === habitId && l.completed)
    .map((l) => l.date)
    .sort()
    .reverse();

  if (habitLogs.length === 0) return { current: 0, longest: 0 };

  let currentStreak = 0;
  const today = new Date();
  const todayStr = formatDate(today);
  const todayDone = habitLogs.includes(todayStr);

  if (!todayDone) {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = formatDate(yesterday);
    if (!habitLogs.includes(yesterdayStr)) {
      return { current: 0, longest: calculateLongestStreak(habitLogs) };
    }
  }

  const startDate = todayDone ? new Date(today) : (() => {
    const d = new Date(today);
    d.setDate(d.getDate() - 1);
    return d;
  })();
  const iterDate = new Date(startDate);

  while (habitLogs.includes(formatDate(iterDate))) {
    currentStreak++;
    iterDate.setDate(iterDate.getDate() - 1);
  }

  const longest = Math.max(currentStreak, calculateLongestStreak(habitLogs));
  return { current: currentStreak, longest };
}

function calculateLongestStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const sorted = [...dates].sort();
  let longest = 1;
  let current = 1;

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diffDays =
      (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays === 1) {
      current++;
      longest = Math.max(longest, current);
    } else if (diffDays > 1) {
      current = 1;
    }
  }
  return longest;
}

export function useHabits() {
  const habits = useQuery(api.habits.list);
  const allLogs = useQuery(api.habitLogs.listAll);

  const createHabit = useMutation(api.habits.create);
  const updateHabit = useMutation(api.habits.update);
  const removeHabit = useMutation(api.habits.remove);
  const toggleLog = useMutation(api.habitLogs.toggle);

  const isLoaded = habits !== undefined && allLogs !== undefined;

  // Normalize logs for streak calculation (Convex IDs → string)
  const normalizedLogs = (allLogs ?? []).map((l) => ({
    habitId: l.habitId as string,
    date: l.date,
    completed: l.completed,
  }));

  // Compute stats for each habit
  const habitsWithStats = (habits ?? []).map((habit) => {
    const habitIdStr = habit._id as string;
    const streak = calculateStreak(habitIdStr, normalizedLogs);
    const habitLogs = normalizedLogs.filter((l) => l.habitId === habitIdStr);
    const totalCompletions = habitLogs.filter((l) => l.completed).length;

    const createdAt = new Date(habit._creationTime);
    const today = new Date();
    const totalDays = Math.max(
      1,
      Math.ceil((today.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
    );
    const completionRate = Math.round((totalCompletions / totalDays) * 100);

    const todayCompleted = normalizedLogs.some(
      (l) => l.habitId === habitIdStr && l.date === getToday() && l.completed
    );

    return {
      _id: habit._id,
      id: habit._id, // alias for compatibility
      name: habit.name,
      description: habit.description,
      category: habit.category as HabitCategory,
      color: habit.color,
      frequency: habit.frequency,
      createdAt: new Date(habit._creationTime).toISOString(),
      archived: habit.archived,
      currentStreak: streak.current,
      longestStreak: streak.longest,
      completionRate,
      todayCompleted,
      totalCompletions,
    };
  });

  // Overall stats
  const activeHabits = habitsWithStats;
  const todayCompletions = activeHabits.filter((h) => h.todayCompleted).length;

  const last7Days: number[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = formatDate(date);
    const completed = activeHabits.filter((h) =>
      normalizedLogs.some(
        (l) => l.habitId === (h._id as string) && l.date === dateStr && l.completed
      )
    ).length;
    last7Days.push(
      activeHabits.length > 0
        ? Math.round((completed / activeHabits.length) * 100)
        : 0
    );
  }

  let bestStreak = 0;
  let bestStreakHabit = "";
  activeHabits.forEach((h) => {
    if (h.currentStreak > bestStreak) {
      bestStreak = h.currentStreak;
      bestStreakHabit = h.name;
    }
  });

  const overallStats = {
    totalHabits: activeHabits.length,
    todayCompletions,
    todayTotal: activeHabits.length,
    todayRate:
      activeHabits.length > 0
        ? Math.round((todayCompletions / activeHabits.length) * 100)
        : 0,
    totalCompletions: normalizedLogs.filter((l) => l.completed).length,
    last7Days,
    bestStreak,
    bestStreakHabit,
  };

  // Actions
  const addHabit = async (habit: {
    name: string;
    description: string;
    category: HabitCategory;
    color: string;
    frequency: "daily" | "weekdays" | "weekends" | "custom";
  }) => {
    await createHabit(habit);
  };

  const editHabit = async (
    id: Id<"habits">,
    updates: {
      name?: string;
      description?: string;
      category?: HabitCategory;
      color?: string;
      frequency?: "daily" | "weekdays" | "weekends" | "custom";
      archived?: boolean;
    }
  ) => {
    await updateHabit({ id, ...updates });
  };

  const deleteHabit = async (id: Id<"habits">) => {
    await removeHabit({ id });
  };

  const toggleToday = async (habitId: Id<"habits">) => {
    const today = getToday();
    await toggleLog({ habitId, date: today });
  };

  return {
    habits: habitsWithStats,
    allHabits: habits ?? [],
    logs: allLogs ?? [],
    isLoaded,
    addHabit,
    updateHabit: editHabit,
    deleteHabit,
    toggleToday,
    overallStats,
  };
}
