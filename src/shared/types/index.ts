export type EntityId = string;
export type LocalDate = string; // YYYY-MM-DD
export type Instant = string;   // ISO 8601 timestamp

export interface Entity {
  id: EntityId;
  createdAt: Instant;
  updatedAt: Instant;
}

export type EntityType =
  | "task"
  | "note"
  | "habit"
  | "habitEntry"
  | "focusSession"
  | "calendarEntry"
  | "transaction"
  | "goal"
  | "journalEntry"
  | "fitnessPlan"
  | "workoutSession"
  | "tag";

export interface EntityRef {
  type: EntityType;
  id: EntityId;
}

export interface EntityLink extends Entity {
  source: EntityRef;
  target: EntityRef;
  kind: "related" | "supports" | "scheduled" | "contributesTo";
}

export interface Task extends Entity {
  title: string;
  listId?: EntityId;
  description?: string;
  status: "todo" | "inProgress" | "done" | "cancelled";
  priority: "low" | "medium" | "high";
  dueAt?: Instant;
  parentTaskId?: EntityId;
  projectId?: EntityId;
  goalIds: EntityId[];
  tagIds: EntityId[];
  pinned?: boolean;
  schedule?: {
    kind: "once" | "interval" | "weekly";
    intervalDays?: number;
    weekdays?: number[];
    startDate?: LocalDate;
    deadline?: Instant;
  };
}

export interface TaskList extends Entity {
  name: string;
  color?: string;
}

export interface Goal extends Entity {
  title: string;
  description?: string;
  status: "active" | "completed" | "paused" | "cancelled";
  targetDate?: LocalDate;
  completedAt?: Instant;
}

export interface Project extends Entity {
  title: string;
  description?: string;
  status: "active" | "completed" | "paused" | "cancelled";
  goalIds: EntityId[];
  targetDate?: LocalDate;
}

export interface Note extends Entity {
  title: string;
  markdown: string;
  date?: LocalDate;
  projectId?: EntityId;
  tagIds: EntityId[];
  order?: number;
}

export interface Resource extends Entity {
  title: string;
  url: string;
  description?: string;
}

export interface JournalEntry extends Entity {
  date: LocalDate;
  markdown: string;
  mood?: "great" | "good" | "okay" | "low" | "difficult";
  linkedEntities: EntityRef[];
}

export interface Habit extends Entity {
  title: string;
  description?: string;
  schedule: {
    frequency: "daily" | "weekly";
    daysOfWeek?: number[];
  };
  targetPerDay?: number;
  archived: boolean;
}

export interface HabitEntry extends Entity {
  habitId: EntityId;
  date: LocalDate;
  value: number;
  completed: boolean;
}

export interface FocusSession extends Entity {
  taskId?: EntityId;
  kind: "focus" | "shortBreak" | "longBreak";
  plannedSeconds: number;
  startedAt: Instant;
  endedAt?: Instant;
  notes?: string;
}

export interface CalendarEntry extends Entity {
  title: string;
  startAt: Instant;
  endAt: Instant;
  allDay?: boolean;
  description?: string;
}

export interface Transaction extends Entity {
  kind: "income" | "expense";
  amountMinor: number;
  currency: string;
  occurredAt: Instant;
  category?: string;
  categoryId?: EntityId;
  note?: string;
}

export interface FinancePlan extends Entity {
  title: string;
  categories: Array<{ name: string; percentage: number }>;
  currency: string;
  month: string;
  notes?: string;
}

export interface FitnessExercise {
  id: EntityId;
  name: string;
  sets?: number;
  reps?: number;
  durationMinutes?: number;
  targetWeightKg?: number;
  notes?: string;
}

export interface FitnessPlan extends Entity {
  title: string;
  description?: string;
  scheduledDays: number[];
  exercises: FitnessExercise[];
  archived: boolean;
}

export interface FitnessGoal extends Entity {
  title: string;
  target?: string;
  deadline?: LocalDate;
  completed: boolean;
}

export interface WorkoutSession extends Entity {
  planId?: EntityId;
  date: LocalDate;
  startedAt?: Instant;
  completedAt?: Instant;
  durationMinutes?: number;
  exerciseResults: Array<{
    exerciseId?: EntityId;
    exerciseName: string;
    setsCompleted?: number;
    repsCompleted?: number;
    weightKg?: number;
    notes?: string;
  }>;
  notes?: string;
}

export interface Tag extends Entity {
  name: string;
  color?: string;
}

// Module availability
export type ModuleKey =
  | "tasks"
  | "projects"
  | "notes"
  | "resources"
  | "focus"
  | "habits"
  | "calendar"
  | "finance"
  | "goals"
  | "dailyJournal"
  | "fitness";

export interface ModuleConfig {
  key: ModuleKey;
  name: string;
  description: string;
  icon:
    | "ListTodo"
    | "FolderKanban"
    | "NotebookPen"
    | "Link2"
    | "Timer"
    | "ChartNoAxesColumnIncreasing"
    | "CalendarDays"
    | "Wallet"
    | "Target"
    | "BookHeart"
    | "Dumbbell";
  order: number;
}

// User preferences and settings
export interface UserPreferences extends Entity {
  userId: EntityId;
  enabledModules: ModuleKey[];
  onboardingCompleted: boolean;
  theme: "light" | "dark" | "system";
  language: "en" | "hu";
}

export interface User extends Entity {
  username: string;
  email: string;
  preferences: UserPreferences;
}
