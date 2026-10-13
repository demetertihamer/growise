import type { User } from '@/shared/types';
import { supabase } from './client';

export interface CloudFocusTimer {
  startedAt: string | null;
  resumedAt: string | null;
  elapsedSeconds: number;
  remainingSeconds: number;
  plannedSeconds: number;
  phase: 'focus' | 'break';
}

export interface CloudWorkspace {
  dataByUser: Record<string, unknown>;
  focusTimers: Record<string, CloudFocusTimer>;
}

const requireClient = () => {
  if (!supabase) throw new Error('Supabase is not configured.');
  return supabase;
};

export const saveCloudProfile = async (user: User) => {
  const client = requireClient();
  const { error } = await client.from('profiles').upsert({
    id: user.id,
    username: user.username,
    email: user.email,
    preferences: user.preferences,
    created_at: user.createdAt,
    updated_at: user.updatedAt,
  });
  if (error) throw error;
};

export const saveCloudWorkspace = async (userId: string, workspace: CloudWorkspace) => {
  const client = requireClient();
  const { error } = await client.from('workspaces').upsert({
    user_id: userId,
    data: workspace,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
};

export const loadCloudAccount = async (userId: string) => {
  const client = requireClient();
  const [profileResult, workspaceResult] = await Promise.all([
    client.from('profiles').select('*').eq('id', userId).maybeSingle(),
    client.from('workspaces').select('data').eq('user_id', userId).maybeSingle(),
  ]);
  if (profileResult.error) throw profileResult.error;
  if (workspaceResult.error) throw workspaceResult.error;
  return {
    profile: profileResult.data,
    workspace: (workspaceResult.data?.data ?? null) as CloudWorkspace | null,
  };
};
