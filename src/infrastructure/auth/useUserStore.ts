import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ModuleKey, User, UserPreferences } from '@/shared/types';

interface UserStore {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User) => void;
  login: () => void;
  logout: () => void;
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
  toggleModule: (moduleKey: ModuleKey) => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      setUser: (user: User) =>
        set({
          user,
          isAuthenticated: true,
        }),

      login: () => set({ isAuthenticated: true }),

      logout: () =>
        set({ isAuthenticated: false }),

      updatePreferences: (preferences: Partial<UserPreferences>) =>
        set((state) => {
          if (!state.user) return state;
          const now = new Date().toISOString();
          return {
            user: {
              ...state.user,
              preferences: {
                ...state.user.preferences,
                ...preferences,
                updatedAt: now,
              },
              updatedAt: now,
            },
          };
        }),

      toggleModule: (moduleKey: ModuleKey) =>
        set((state) => {
          if (!state.user) return state;
          const enabledModules = state.user.preferences.enabledModules;
          const isEnabled = enabledModules.includes(moduleKey);
          const now = new Date().toISOString();
          return {
            user: {
              ...state.user,
              preferences: {
                ...state.user.preferences,
                enabledModules: isEnabled
                  ? enabledModules.filter((m) => m !== moduleKey)
                  : [...enabledModules, moduleKey],
                updatedAt: now,
              },
              updatedAt: now,
            },
          };
        }),
    }),
    {
      name: 'growise-user-store',
    }
  )
);
