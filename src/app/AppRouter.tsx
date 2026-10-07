import { useEffect } from 'react';
import { useUserStore } from '@/infrastructure/auth/useUserStore';
import { AuthFlow } from './auth/AuthFlow';
import { OnboardingFlow } from './onboarding/OnboardingFlow';
import { MainApp } from './MainApp';

export const AppRouter = () => {
  const user = useUserStore((state) => state.user);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const applyTheme = () => {
      const preference = user?.preferences.theme ?? 'light';
      const isDark = preference === 'dark' || (preference === 'system' && media.matches);
      document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
      document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
    };

    applyTheme();
    media.addEventListener('change', applyTheme);
    return () => media.removeEventListener('change', applyTheme);
  }, [user?.preferences.theme]);

  if (!isAuthenticated || !user) {
    return <AuthFlow />;
  }

  if (!user.preferences.onboardingCompleted) {
    return <OnboardingFlow />;
  }

  return <MainApp />;
};
