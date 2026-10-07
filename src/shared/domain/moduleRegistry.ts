import type { ModuleConfig, ModuleKey } from '../types';

export const MODULE_REGISTRY: Record<ModuleKey, ModuleConfig> = {
  tasks: {
    key: 'tasks',
    name: 'Tasks',
    description: 'Keep track of what needs to get done.',
    icon: 'ListTodo',
    order: 1,
  },
  notes: {
    key: 'notes',
    name: 'Notes',
    description: 'Capture thoughts, plans, and daily notes.',
    icon: 'NotebookPen',
    order: 2,
  },
  focus: {
    key: 'focus',
    name: 'Focus / Pomodoro',
    description: 'Make time for focused work and breaks.',
    icon: 'Timer',
    order: 3,
  },
  habits: {
    key: 'habits',
    name: 'Habits',
    description: 'Build routines one day at a time.',
    icon: 'ChartNoAxesColumnIncreasing',
    order: 4,
  },
  calendar: {
    key: 'calendar',
    name: 'Calendar',
    description: 'See your plans in one place.',
    icon: 'CalendarDays',
    order: 5,
  },
  finance: {
    key: 'finance',
    name: 'Finance',
    description: 'Understand your income and spending.',
    icon: 'Wallet',
    order: 6,
  },
  goals: {
    key: 'goals',
    name: 'Goals',
    description: 'Keep your goals visible and connect tasks to them.',
    icon: 'Target',
    order: 7,
  },
  dailyJournal: {
    key: 'dailyJournal',
    name: 'Daily Journal',
    description: 'Reflect on each day and keep a personal record.',
    icon: 'BookHeart',
    order: 8,
  },
  fitness: {
    key: 'fitness',
    name: 'Fitness',
    description: 'Plan workouts and track your training.',
    icon: 'Dumbbell',
    order: 9,
  },
};
