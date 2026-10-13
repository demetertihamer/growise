import { useState, type FormEvent } from 'react';
import { ArrowRight, CircleCheck, CircleX, Leaf, LockKeyhole, Mail, UserRound } from 'lucide-react';
import { useUserStore } from '@/infrastructure/auth/useUserStore';
import { createLocalAccount, verifyLocalAccount } from '@/infrastructure/auth/localAuth';
import { isSupabaseConfigured } from '@/infrastructure/supabase/config';
import type { User } from '@/shared/types';
import { translate, type Language } from '@/shared/i18n';

export const AuthFlow = () => {
  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);
  const login = useUserStore((state) => state.login);
  const [isLogin, setIsLogin] = useState(Boolean(user));
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState(user?.email ?? '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('en');
  const language = (user?.preferences.language ?? selectedLanguage) as Language;
  const t = (text: string) => translate(language, text);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    const normalizedUsername = username.trim();
    const normalizedEmail = email.trim();

    if (!normalizedEmail || !password || (!isLogin && !normalizedUsername)) {
      setError(t('Please complete all required fields.'));
      return;
    }
    if (!isLogin && password.length < 8) {
      setError(t('Use at least 8 characters for your password.'));
      return;
    }
    if (!isLogin && password !== confirmPassword) {
      setError(t('Passwords do not match.'));
      return;
    }

    setIsSubmitting(true);
    try {
      if (isSupabaseConfigured) {
        const [{ supabase }, { loadCloudAccount, saveCloudProfile }] = await Promise.all([
          import('@/infrastructure/supabase/client'),
          import('@/infrastructure/supabase/cloudSync'),
        ]);
        if (!supabase) throw new Error(t('Could not connect to the account service.'));
        const result = isLogin
          ? await supabase.auth.signInWithPassword({ email: normalizedEmail, password })
          : await supabase.auth.signUp({ email: normalizedEmail, password, options: { data: { username: normalizedUsername } } });
        if (result.error) throw result.error;
        if (!result.data.user) throw new Error(t('Could not complete account setup.'));
        if (!result.data.session) {
          throw new Error(t('Check your email to confirm your account before signing in.'));
        }
        const remote = await loadCloudAccount(result.data.user.id);
        const now = new Date().toISOString();
        const newUser: User = remote.profile
          ? {
            id: remote.profile.id,
            username: remote.profile.username,
            email: remote.profile.email,
            createdAt: remote.profile.created_at,
            updatedAt: remote.profile.updated_at,
            preferences: remote.profile.preferences as User['preferences'],
          }
          : {
            id: result.data.user.id,
            username: normalizedUsername || String(result.data.user.user_metadata.username ?? normalizedEmail.split('@')[0]),
            email: normalizedEmail,
            createdAt: now,
            updatedAt: now,
            preferences: {
              id: crypto.randomUUID(),
              userId: result.data.user.id,
              enabledModules: [],
              onboardingCompleted: false,
              theme: 'system',
              language: selectedLanguage,
              createdAt: now,
              updatedAt: now,
            },
          };
        setUser(newUser);
        if (!remote.profile) await saveCloudProfile(newUser);
      } else if (isLogin) {
        const verified = await verifyLocalAccount(normalizedEmail, password);
        if (!verified) {
          setError(t('Email or password is incorrect.'));
          return;
        }
        if (!user || user.email.toLowerCase() !== normalizedEmail.toLowerCase()) {
          setError(t('Your account profile is missing. Please create an account.'));
          return;
        }
        login();
      } else {
        await createLocalAccount(normalizedEmail, password);
        const now = new Date().toISOString();
        const id = crypto.randomUUID();
        const newUser: User = {
          id,
          username: normalizedUsername,
          email: normalizedEmail,
          createdAt: now,
          updatedAt: now,
          preferences: {
            id: crypto.randomUUID(),
            userId: id,
            enabledModules: [],
            onboardingCompleted: false,
            theme: 'system',
            language: selectedLanguage,
            createdAt: now,
            updatedAt: now,
          },
        };
        setUser(newUser);
      }
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : t('Could not complete account setup.'),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-screen">
      <div className="auth-card">
        <div className="brand-mark"><Leaf size={19} /></div>
        <p className="eyebrow">{t('A calmer space to grow')}</p>
        <h1>{t(isLogin ? 'Welcome back' : 'Make room for what matters.')}</h1>
        <div className="auth-language-switch" role="group" aria-label={t('Language')}>
          <button type="button" className={selectedLanguage === 'en' ? 'is-active' : ''} onClick={() => setSelectedLanguage('en')}>{t('English')}</button>
          <button type="button" className={selectedLanguage === 'hu' ? 'is-active' : ''} onClick={() => setSelectedLanguage('hu')}>{t('Hungarian')}</button>
        </div>
        <p className="auth-intro">
          {isLogin
            ? t('Sign in to your Growise account.')
            : t('Start with the tools that fit your life. You can change them whenever you like.')}
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <label className="field">
              <span>{t('Your name')}</span>
              <div className="input-wrap">
                <UserRound size={18} />
                <input
                  name="username"
                  autoComplete="name"
                  placeholder=""
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  required
                />
              </div>
            </label>
          )}
          <label className="field">
            <span>{t('Email')}</span>
            <div className="input-wrap">
              <Mail size={18} />
              <input
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder=""
                required
              />
            </div>
          </label>
          <label className="field">
            <span>{t('Password')}</span>
            <div className="input-wrap">
              <LockKeyhole size={18} />
              <input
                name="password"
                type="password"
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                placeholder=""
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={isLogin ? undefined : 8}
                required
              />
            </div>
            {!isLogin && (
              <span className={`password-requirement ${password.length >= 8 ? 'is-valid' : 'is-invalid'}`}>
                {password.length >= 8 ? <CircleCheck size={16} aria-hidden="true" /> : <CircleX size={16} aria-hidden="true" />}
                {t('At least 8 characters')}
              </span>
            )}
          </label>
          {!isLogin && (
            <label className="field">
              <span>{t('Confirm password')}</span>
              <div className="input-wrap">
                <LockKeyhole size={18} />
                <input
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder=""
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  minLength={8}
                  required
                />
              </div>
            </label>
          )}

          {error && <p className="form-error" role="alert">{error}</p>}

          <button className="primary-button auth-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? t('Please wait…') : t(isLogin ? 'Sign in' : 'Create account')}
            {!isSubmitting && <ArrowRight size={17} />}
          </button>
        </form>

        <p className="auth-switch">
          {t(isLogin ? 'New to Growise?' : 'Already have an account?')}{' '}
          <button
            type="button"
            onClick={() => {
              setIsLogin((value) => !value);
              setError('');
            }}
          >
            {t(isLogin ? 'Create account' : 'Sign in')}
          </button>
        </p>
        <p className="local-note">{t('Your account and preferences are synchronized across your devices.')}</p>
      </div>
    </main>
  );
};
