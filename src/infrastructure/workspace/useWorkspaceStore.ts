import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  CalendarEntry,
  Entity,
  FitnessPlan,
  FitnessGoal,
  FocusSession,
  FinancePlan,
  Goal,
  Habit,
  HabitEntry,
  JournalEntry,
  Note,
  Project,
  Resource,
  Task,
  TaskList,
  Transaction,
  WorkoutSession,
} from '@/shared/types';

interface WorkspaceCollections {
  tasks: Task;
  taskLists: TaskList;
  projects: Project;
  notes: Note;
  resources: Resource;
  goals: Goal;
  habits: Habit;
  habitEntries: HabitEntry;
  focusSessions: FocusSession;
  calendarEntries: CalendarEntry;
  transactions: Transaction;
  financePlans: FinancePlan;
  fitnessPlans: FitnessPlan;
  fitnessGoals: FitnessGoal;
  workoutSessions: WorkoutSession;
  journalEntries: JournalEntry;
}

type CollectionName = keyof WorkspaceCollections;
type CollectionItem<K extends CollectionName> = WorkspaceCollections[K];
type WorkspaceData = { [K in CollectionName]: WorkspaceCollections[K][] };

export interface FocusTimerState {
  startedAt: string | null;
  resumedAt: string | null;
  elapsedSeconds: number;
  remainingSeconds: number;
  plannedSeconds: number;
  phase: 'focus' | 'break';
}

export const EMPTY_FOCUS_TIMER: FocusTimerState = {
  startedAt: null,
  resumedAt: null,
  elapsedSeconds: 0,
  remainingSeconds: 25 * 60,
  plannedSeconds: 25 * 60,
  phase: 'focus',
};

const EMPTY_WORKSPACE: WorkspaceData = {
  tasks: [],
  taskLists: [],
  projects: [],
  notes: [],
  resources: [],
  goals: [],
  habits: [],
  habitEntries: [],
  focusSessions: [],
  calendarEntries: [],
  transactions: [],
  financePlans: [],
  fitnessPlans: [],
  fitnessGoals: [],
  workoutSessions: [],
  journalEntries: [],
};

const normalizeWorkspace = (data: Partial<WorkspaceData> | undefined): WorkspaceData => ({
  ...EMPTY_WORKSPACE,
  ...data,
  tasks: data?.tasks ?? [],
  taskLists: data?.taskLists ?? [],
  projects: data?.projects ?? [],
  notes: data?.notes ?? [],
  resources: data?.resources ?? [],
  goals: data?.goals ?? [],
  habits: data?.habits ?? [],
  habitEntries: data?.habitEntries ?? [],
  focusSessions: data?.focusSessions ?? [],
  calendarEntries: data?.calendarEntries ?? [],
  transactions: data?.transactions ?? [],
  financePlans: (data?.financePlans ?? []).map((plan) => {
    const legacy = plan as FinancePlan & { amountMinor?: number };
    return legacy.categories
      ? legacy
      : {
        ...legacy,
        categories: [{ name: legacy.title, percentage: 100 }],
      };
  }),
  fitnessPlans: data?.fitnessPlans ?? [],
  fitnessGoals: data?.fitnessGoals ?? [],
  workoutSessions: data?.workoutSessions ?? [],
  journalEntries: data?.journalEntries ?? [],
});

interface WorkspaceState {
  dataByUser: Record<string, WorkspaceData>;
  focusTimers: Record<string, FocusTimerState>;
  add: <K extends CollectionName>(userId: string, collection: K, item: CollectionItem<K>) => void;
  update: <K extends CollectionName>(
    userId: string,
    collection: K,
    id: string,
    patch: Partial<CollectionItem<K>>,
  ) => void;
  remove: (userId: string, collection: CollectionName, id: string) => void;
  setFocusTimer: (userId: string, timer: FocusTimerState) => void;
}

const addToCollection = <K extends CollectionName>(
  data: WorkspaceData,
  collection: K,
  item: CollectionItem<K>,
): WorkspaceData => ({
  ...data,
  [collection]: [...(data[collection] ?? []), item],
});

const updateCollection = <K extends CollectionName>(
  data: WorkspaceData,
  collection: K,
  id: string,
  patch: Partial<CollectionItem<K>>,
): WorkspaceData => ({
  ...data,
  [collection]: (data[collection] ?? []).map((item) =>
    item.id === id ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item,
  ),
});

const removeFromCollection = (
  data: WorkspaceData,
  collection: CollectionName,
  id: string,
): WorkspaceData => ({
  ...data,
  [collection]: (data[collection] ?? []).filter((item) => item.id !== id),
});

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      dataByUser: {},
      focusTimers: {},
      add: (userId, collection, item) =>
        set((state) => ({
          dataByUser: {
            ...state.dataByUser,
            [userId]: addToCollection(
              normalizeWorkspace(state.dataByUser[userId]),
              collection,
              item,
            ),
          },
        })),
      update: (userId, collection, id, patch) =>
        set((state) => ({
          dataByUser: {
            ...state.dataByUser,
            [userId]: updateCollection(
              normalizeWorkspace(state.dataByUser[userId]),
              collection,
              id,
              patch,
            ),
          },
        })),
      remove: (userId, collection, id) =>
        set((state) => ({
          dataByUser: {
            ...state.dataByUser,
            [userId]: removeFromCollection(
              normalizeWorkspace(state.dataByUser[userId]),
              collection,
              id,
            ),
          },
        })),
      setFocusTimer: (userId, timer) =>
        set((state) => ({
          focusTimers: { ...state.focusTimers, [userId]: timer },
        })),
    }),
    { name: 'growise-workspace-v1' },
  ),
);

export const createEntity = <T extends Omit<Entity, 'id' | 'createdAt' | 'updatedAt'>>(
  values: T,
): T & Pick<Entity, 'id' | 'createdAt' | 'updatedAt'> => {
  const now = new Date().toISOString();
  return { ...values, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
};

export const getLocalDate = (date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
