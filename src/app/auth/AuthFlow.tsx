import { useState, type FormEvent } from 'react';
import { ArrowRight, Leaf, LockKeyhole, Mail, UserRound } from 'lucide-react';
import { useUserStore } from '@/infrastructure/auth/useUserStore';
import { createLocalAccount, verifyLocalAccount } from '@/infrastructure/auth/localAuth';
import type { User } from '@/shared/types';

export const AuthFlow = () => {
  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);
  const login = useUserStore((state) => state.login);
  const [isLogin, setIsLogin] = useState(Boolean(user));
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    const formData = new FormData(e.currentTarget);
    const username = String(formData.get('username') ?? '').trim();
    const email = String(formData.get('email') ?? '').trim();
    const password = String(formData.get('password') ?? '');
    const confirmPassword = String(formData.get('confirmPassword') ?? '');

    if (!email || !password || (!isLogin && !username)) {
      setError('Please complete all required fields.');
      return;
    }
    if (!isLogin && password.length < 8) {
      setError('Use at least 8 characters for your password.');
      return;
    }
    if (!isLogin && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isLogin) {
        const verified = await verifyLocalAccount(email, password);
        if (!verified) {
          setError('Email or password is incorrect.');
          return;
        }
        if (!user || user.email.toLowerCase() !== email.trim().toLowerCase()) {
          setError('The local profile is missing. Create a new local account.');
          return;
        }
        login();
      } else {
        await createLocalAccount(email, password);
        const now = new Date().toISOString();
        const id = crypto.randomUUID();
        const newUser: User = {
          id,
          username,
          email: email.trim(),
          createdAt: now,
          updatedAt: now,
          preferences: {
            id: crypto.randomUUID(),
            userId: id,
            enabledModules: [],
            onboardingCompleted: false,
            theme: 'system',
            language: 'en',
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
          : 'Could not complete account setup.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-screen">
      <div className="auth-card">
        <div className="brand-mark"><Leaf size={19} /></div>
        <p className="eyebrow">A calmer space to grow</p>
        <h1>{isLogin ? 'Welcome back' : 'Make room for what matters.'}</h1>
        <p className="auth-intro">
          {isLogin
            ? 'Sign in to your local Growise profile.'
            : 'Start with the tools that fit your life. You can change them whenever you like.'}
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <label className="field">
              <span>Your name</span>
              <div className="input-wrap">
                <UserRound size={18} />
                <input
                  name="username"
                  autoComplete="name"
                  placeholder="Alex Morgan"
                  required
                />
              </div>
            </label>
          )}
          <label className="field">
            <span>Email</span>
            <div className="input-wrap">
              <Mail size={18} />
              <input
                name="email"
                type="email"
                autoComplete="email"
                defaultValue={user?.email ?? ''}
                placeholder="you@example.com"
                required
              />
            </div>
          </label>
          <label className="field">
            <span>Password</span>
            <div className="input-wrap">
              <LockKeyhole size={18} />
              <input
                name="password"
                type="password"
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                placeholder={isLogin ? 'Your password' : 'At least 8 characters'}
                minLength={isLogin ? undefined : 8}
                required
              />
            </div>
          </label>
          {!isLogin && (
            <label className="field">
              <span>Confirm password</span>
              <div className="input-wrap">
                <LockKeyhole size={18} />
                <input
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Enter your password again"
                  minLength={8}
                  required
                />
              </div>
            </label>
          )}

          {error && <p className="form-error" role="alert">{error}</p>}

          <button className="primary-button auth-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Please wait…' : isLogin ? 'Sign in' : 'Create local account'}
            {!isSubmitting && <ArrowRight size={17} />}
          </button>
        </form>

        <p className="auth-switch">
          {isLogin ? 'New to Growise?' : 'Already have a local account?'}{' '}
          <button
            type="button"
            onClick={() => {
              setIsLogin((value) => !value);
              setError('');
            }}
          >
            {isLogin ? 'Create account' : 'Sign in'}
          </button>
        </p>
        <p className="local-note">Your account and preferences stay on this device.</p>
      </div>
    </main>
  );
};
