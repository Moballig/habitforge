export interface Habit {
  id: string;
  name: string;
  description: string;
  category: HabitCategory;
  color: string;
  frequency: 'daily' | 'weekdays' | 'weekends' | 'custom';
  customDays?: number[]; // 0=Sunday, 6=Saturday
  createdAt: string; // ISO date
  archived: boolean;
}

export type HabitCategory = 
  | 'health' 
  | 'fitness' 
  | 'mindfulness' 
  | 'productivity' 
  | 'learning' 
  | 'social' 
  | 'creativity' 
  | 'other';

export interface HabitLog {
  habitId: string;
  date: string; // YYYY-MM-DD format
  completed: boolean;
  note?: string;
}

export interface HabitWithStats extends Habit {
  currentStreak: number;
  longestStreak: number;
  completionRate: number;
  todayCompleted: boolean;
  totalCompletions: number;
}

export interface WeeklyReport {
  weekStart: string;
  weekEnd: string;
  overallCompletionRate: number;
  bestHabit: string;
  worstHabit: string;
  totalCompletions: number;
  totalMissed: number;
  insights: string;
  generatedAt: string;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export const CATEGORY_CONFIG: Record<HabitCategory, { label: string; emoji: string; color: string }> = {
  health: { label: 'Health', emoji: '💊', color: '#10B981' },
  fitness: { label: 'Fitness', emoji: '💪', color: '#F59E0B' },
  mindfulness: { label: 'Mindfulness', emoji: '🧘', color: '#8B5CF6' },
  productivity: { label: 'Productivity', emoji: '⚡', color: '#3B82F6' },
  learning: { label: 'Learning', emoji: '📚', color: '#EC4899' },
  social: { label: 'Social', emoji: '👥', color: '#14B8A6' },
  creativity: { label: 'Creativity', emoji: '🎨', color: '#F97316' },
  other: { label: 'Other', emoji: '✨', color: '#6B7280' },
};

export const CATEGORY_COLORS: Record<HabitCategory, string> = {
  health: '#10B981',
  fitness: '#F59E0B',
  mindfulness: '#8B5CF6',
  productivity: '#3B82F6',
  learning: '#EC4899',
  social: '#14B8A6',
  creativity: '#F97316',
  other: '#6B7280',
};
