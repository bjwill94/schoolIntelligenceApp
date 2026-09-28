-- ==============================================================================
-- School Register Database Schema for Supabase
-- Run this script in the Supabase Dashboard -> SQL Editor -> Run
-- ==============================================================================

-- 1. Create user_classes table
create table if not exists public.user_classes (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  grade text not null,
  section text not null,
  exams jsonb not null default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable Row-Level Security (RLS)
alter table public.user_classes enable row level security;

-- Drop existing policies if re-running
drop policy if exists "Users can read own classes" on public.user_classes;
drop policy if exists "Users can insert own classes" on public.user_classes;
drop policy if exists "Users can update own classes" on public.user_classes;
drop policy if exists "Users can delete own classes" on public.user_classes;

-- 3. Row-Level Security Policies (Users can only access their own data)
create policy "Users can read own classes"
  on public.user_classes for select
  using (auth.uid() = user_id);

create policy "Users can insert own classes"
  on public.user_classes for insert
  with check (auth.uid() = user_id);

create policy "Users can update own classes"
  on public.user_classes for update
  using (auth.uid() = user_id);

create policy "Users can delete own classes"
  on public.user_classes for delete
  using (auth.uid() = user_id);

-- 4. Create index for fast user lookups
create index if not exists idx_user_classes_user_id on public.user_classes(user_id);
