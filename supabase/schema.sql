-- Habitly Phase 1 backend schema
-- Run this in the Supabase SQL Editor (Dashboard -> SQL Editor -> New query),
-- then run seed.sql, then storage.sql.
-- Safe to re-run: every statement is guarded with IF NOT EXISTS / OR REPLACE.

-- =========================================================================
-- profiles
-- =========================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  tier text not null default 'basic' check (tier in ('basic', 'pro', 'premium')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================================================================
-- goals (1 row per user)
-- =========================================================================
create table if not exists public.goals (
  user_id uuid primary key references auth.users(id) on delete cascade,
  water_glasses int not null default 8,
  sleep_hours numeric not null default 8,
  steps int not null default 10000,
  workout_minutes int not null default 30,
  current_weight_kg numeric,
  target_weight_kg numeric,
  age int,
  height_cm numeric,
  gender text,
  activity_level text,
  health_conditions text,
  dietary_preferences text,
  wake_time time,
  sleep_time time,
  active_routine jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- =========================================================================
-- exercise_library (global catalog + per-user custom entries)
-- =========================================================================
create table if not exists public.exercise_library (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  level text,
  met numeric,
  tags text[] not null default '{}',
  is_global boolean not null default true,
  created_by uuid references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create unique index if not exists exercise_library_name_owner_key
  on public.exercise_library (name, coalesce(created_by, '00000000-0000-0000-0000-000000000000'::uuid));

-- =========================================================================
-- workouts (one row per logged activity; session_id groups a live session)
-- =========================================================================
create table if not exists public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_id uuid references public.exercise_library(id) on delete set null,
  activity text not null,
  exercise_name text,
  session_id bigint,
  duration_minutes numeric,
  distance_km numeric,
  calories numeric,
  details jsonb not null default '{}'::jsonb,
  logged_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists workouts_user_logged_at_idx on public.workouts (user_id, logged_at desc);
create index if not exists workouts_user_session_idx on public.workouts (user_id, session_id);

-- =========================================================================
-- foods (global catalog + per-user custom entries)
-- =========================================================================
create table if not exists public.foods (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  icon text,
  category text,
  tags text[] not null default '{}',
  keywords text[] not null default '{}',
  default_qty numeric not null default 1,
  cal numeric not null default 0,
  p numeric not null default 0,
  c numeric not null default 0,
  f numeric not null default 0,
  photo_url text,
  is_global boolean not null default true,
  created_by uuid references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create unique index if not exists foods_name_owner_key
  on public.foods (name, coalesce(created_by, '00000000-0000-0000-0000-000000000000'::uuid));

-- =========================================================================
-- food_logs (one row per logged food entry)
-- =========================================================================
create table if not exists public.food_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  food_id uuid references public.foods(id) on delete set null,
  name text not null,
  cal numeric not null default 0,
  p numeric not null default 0,
  c numeric not null default 0,
  f numeric not null default 0,
  quantity numeric not null default 1,
  photo_url text,
  category text,
  logged_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists food_logs_user_logged_at_idx on public.food_logs (user_id, logged_at desc);

-- =========================================================================
-- water_logs (append-only, timestamped)
-- =========================================================================
create table if not exists public.water_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  glasses numeric not null,
  logged_at timestamptz not null default now()
);
create index if not exists water_logs_user_logged_at_idx on public.water_logs (user_id, logged_at desc);

-- =========================================================================
-- daily_metrics (steps & sleep, one row per user per day)
-- =========================================================================
create table if not exists public.daily_metrics (
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  steps int not null default 0 check (steps >= 0),
  sleep_hours numeric not null default 0 check (sleep_hours >= 0 and sleep_hours <= 24),
  updated_at timestamptz not null default now(),
  primary key (user_id, log_date)
);

-- =========================================================================
-- weigh_ins (schema-ready, no UI consumes this yet)
-- =========================================================================
create table if not exists public.weigh_ins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  weight_kg numeric not null check (weight_kg > 0),
  logged_at timestamptz not null default now(),
  notes text
);
create index if not exists weigh_ins_user_logged_at_idx on public.weigh_ins (user_id, logged_at desc);

-- =========================================================================
-- emergency_contacts (schema-ready, simple per-user table)
-- =========================================================================
create table if not exists public.emergency_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  relationship text,
  phone text not null,
  created_at timestamptz not null default now()
);
create index if not exists emergency_contacts_user_id_idx on public.emergency_contacts (user_id);

-- =========================================================================
-- migration_state (drives the one-time local -> cloud migration)
-- =========================================================================
create table if not exists public.migration_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  migrated_at timestamptz,
  created_at timestamptz not null default now()
);

-- =========================================================================
-- New-user trigger: seed profiles / goals / migration_state on signup
-- =========================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;

  insert into public.goals (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  insert into public.migration_state (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =========================================================================
-- Row Level Security
-- =========================================================================
alter table public.profiles enable row level security;
alter table public.goals enable row level security;
alter table public.exercise_library enable row level security;
alter table public.workouts enable row level security;
alter table public.foods enable row level security;
alter table public.food_logs enable row level security;
alter table public.water_logs enable row level security;
alter table public.daily_metrics enable row level security;
alter table public.weigh_ins enable row level security;
alter table public.migration_state enable row level security;
alter table public.emergency_contacts enable row level security;

-- profiles (own row, keyed by id not user_id)
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (id = auth.uid());
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

-- goals (own row, keyed by user_id)
drop policy if exists "goals_select_own" on public.goals;
create policy "goals_select_own" on public.goals for select using (user_id = auth.uid());
drop policy if exists "goals_insert_own" on public.goals;
create policy "goals_insert_own" on public.goals for insert with check (user_id = auth.uid());
drop policy if exists "goals_update_own" on public.goals;
create policy "goals_update_own" on public.goals for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- workouts / food_logs / water_logs / weigh_ins / migration_state / emergency_contacts: standard own-row CRUD
do $$
declare
  t text;
begin
  foreach t in array array['workouts', 'food_logs', 'water_logs', 'weigh_ins', 'migration_state', 'emergency_contacts'] loop
    execute format('drop policy if exists "%s_select_own" on public.%I', t, t);
    execute format('create policy "%s_select_own" on public.%I for select using (user_id = auth.uid())', t, t);
    execute format('drop policy if exists "%s_insert_own" on public.%I', t, t);
    execute format('create policy "%s_insert_own" on public.%I for insert with check (user_id = auth.uid())', t, t);
    execute format('drop policy if exists "%s_update_own" on public.%I', t, t);
    execute format('create policy "%s_update_own" on public.%I for update using (user_id = auth.uid()) with check (user_id = auth.uid())', t, t);
    execute format('drop policy if exists "%s_delete_own" on public.%I', t, t);
    execute format('create policy "%s_delete_own" on public.%I for delete using (user_id = auth.uid())', t, t);
  end loop;
end $$;

-- daily_metrics: same pattern, but its PK is (user_id, log_date) so this still works (user_id column exists)
drop policy if exists "daily_metrics_select_own" on public.daily_metrics;
create policy "daily_metrics_select_own" on public.daily_metrics for select using (user_id = auth.uid());
drop policy if exists "daily_metrics_insert_own" on public.daily_metrics;
create policy "daily_metrics_insert_own" on public.daily_metrics for insert with check (user_id = auth.uid());
drop policy if exists "daily_metrics_update_own" on public.daily_metrics;
create policy "daily_metrics_update_own" on public.daily_metrics for update using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "daily_metrics_delete_own" on public.daily_metrics;
create policy "daily_metrics_delete_own" on public.daily_metrics for delete using (user_id = auth.uid());

-- foods / exercise_library: global catalog readable by everyone signed in, writable only for one's own non-global rows
do $$
declare
  t text;
begin
  foreach t in array array['foods', 'exercise_library'] loop
    execute format('drop policy if exists "%s_select_all" on public.%I', t, t);
    execute format('create policy "%s_select_all" on public.%I for select using (is_global = true or created_by = auth.uid())', t, t);
    execute format('drop policy if exists "%s_insert_own" on public.%I', t, t);
    execute format('create policy "%s_insert_own" on public.%I for insert with check (created_by = auth.uid() and is_global = false)', t, t);
    execute format('drop policy if exists "%s_update_own" on public.%I', t, t);
    execute format('create policy "%s_update_own" on public.%I for update using (created_by = auth.uid()) with check (created_by = auth.uid())', t, t);
    execute format('drop policy if exists "%s_delete_own" on public.%I', t, t);
    execute format('create policy "%s_delete_own" on public.%I for delete using (created_by = auth.uid())', t, t);
  end loop;
end $$;
