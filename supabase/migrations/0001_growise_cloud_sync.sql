create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  email text not null,
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspaces (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;

create policy "Users can read their profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can insert their profile"
  on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update their profile"
  on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "Users can read their workspace"
  on public.workspaces for select using (auth.uid() = user_id);
create policy "Users can insert their workspace"
  on public.workspaces for insert with check (auth.uid() = user_id);
create policy "Users can update their workspace"
  on public.workspaces for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
