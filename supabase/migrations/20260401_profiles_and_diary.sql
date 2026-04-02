-- Profiles (1:1 with auth.users) + diary sync
-- Run in Supabase SQL editor after prior migrations.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  child_age int null check (child_age between 8 and 15),
  exam_horizon text null,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles for select
to authenticated
using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create table if not exists public.diary_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  client_id text not null,
  fish_name text not null,
  length_cm int null,
  water text null,
  notes text null,
  created_at timestamptz not null default now(),
  constraint diary_entries_user_client unique (user_id, client_id)
);

create index if not exists diary_entries_user_created_idx
on public.diary_entries (user_id, created_at desc);

alter table public.diary_entries enable row level security;

drop policy if exists "diary_select_own" on public.diary_entries;
create policy "diary_select_own"
on public.diary_entries for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "diary_insert_own" on public.diary_entries;
create policy "diary_insert_own"
on public.diary_entries for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "diary_update_own" on public.diary_entries;
create policy "diary_update_own"
on public.diary_entries for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "diary_delete_own" on public.diary_entries;
create policy "diary_delete_own"
on public.diary_entries for delete
to authenticated
using (auth.uid() = user_id);
