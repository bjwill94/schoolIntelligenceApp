-- ==============================================================================
-- School Register: Supabase schema (fresh install)
-- Paste into Supabase Dashboard -> SQL Editor -> Run.
-- WARNING: drops the old tables and all their data.
--
-- Access model (MVP): every signed-in staff member can read and edit every class.
-- Anonymous visitors get nothing. Staff accounts are created by an admin in
-- Authentication -> Users, and public sign-up must be turned off in
-- Authentication -> Sign In / Providers ("Allow new users to sign up").
-- ==============================================================================

-- 0. Clean slate
drop table if exists public.user_classes cascade;
drop table if exists public.classes cascade;
drop function if exists public.set_class_audit_fields() cascade;

-- 1. One row per class; all of its exams live in the `exams` JSONB column
create table public.classes (
  id text primary key,
  grade text not null,
  section text not null,
  exams jsonb not null default '[]'::jsonb,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  updated_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  -- Also the version token the app uses to detect two people editing at once
  updated_at timestamptz not null default now()
);

-- 2. The database, not the browser, stamps who changed a row and when
create function public.set_class_audit_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.created_by := auth.uid();
    new.created_at := now();
  else
    new.created_by := old.created_by;
    new.created_at := old.created_at;
  end if;
  new.updated_by := auth.uid();
  new.updated_at := now();
  return new;
end;
$$;

create trigger classes_audit_fields
  before insert or update on public.classes
  for each row execute function public.set_class_audit_fields();

-- 3. Row-level security: signed-in staff only
alter table public.classes enable row level security;

create policy "Staff can read all classes"
  on public.classes for select to authenticated using (true);

create policy "Staff can create classes"
  on public.classes for insert to authenticated with check (true);

create policy "Staff can update all classes"
  on public.classes for update to authenticated using (true) with check (true);

create policy "Staff can delete all classes"
  on public.classes for delete to authenticated using (true);

revoke all on public.classes from anon;
grant select, insert, update, delete on public.classes to authenticated;

create index classes_created_at_idx on public.classes (created_at);
