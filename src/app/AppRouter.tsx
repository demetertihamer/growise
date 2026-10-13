import { useEffect } from 'react';
import { useUserStore } from '@/infrastructure/auth/useUserStore';
import { AuthFlow } from './auth/AuthFlow';
import { OnboardingFlow } from './onboarding/OnboardingFlow';
import { MainApp } from './MainApp';
import { useWorkspaceStore } from '@/infrastructure/workspace/useWorkspaceStore';
import { isSupabaseConfigured } from '@/infrastructure/supabase/config';

export const AppRouter = () => {
  const user = useUserStore((state) => state.user);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const hydrateFromCloud = useWorkspaceStore((state) => state.hydrateFromCloud);

  useEffect(() => {
    if (!isSupabaseConfigured || !user || !isAuthenticated) return;
    void hydrateFromCloud(user.id).catch((error: unknown) => {
      console.error('Growise cloud workspace load failed.', error);
    });
  }, [hydrateFromCloud, isAuthenticated, user]);

  useEffect(() => {
    if (!isSupabaseConfigured || !isAuthenticated) return;
    let subscription: { unsubscribe: () => void } | null = null;
    let cancelled = false;
    void import('@/infrastructure/supabase/client').then(({ supabase }) => {
      if (!supabase || cancelled) return;
      const result = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' && useUserStore.getState().isAuthenticated) {
        useUserStore.getState().logout();
      }
      if (event === 'SIGNED_IN' && !session) {
        console.error('Growise received an invalid Supabase sign-in event.');
      }
      });
      subscription = result.data.subscription;
    }).catch((error: unknown) => {
      console.error('Growise Supabase listener failed to initialize.', error);
    });
    return () => {
      cancelled = true;
      subscription?.unsubscribe();
    };
  }, [isAuthenticated]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const applyTheme = () => {
      const preference = user?.preferences.theme ?? 'system';
      const isDark = preference === 'dark' || (preference === 'system' && media.matches);
      document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
      document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
      document.documentElement.lang = user?.preferences.language === 'hu' ? 'hu' : 'en';
    };

    applyTheme();
    media.addEventListener('change', applyTheme);
    return () => media.removeEventListener('change', applyTheme);
  }, [user?.preferences.theme, user?.preferences.language]);

  if (!isAuthenticated || !user) {
    return <AuthFlow />;
  }

  if (!user.preferences.onboardingCompleted) {
    return <OnboardingFlow />;
  }

  return <MainApp />;
};
