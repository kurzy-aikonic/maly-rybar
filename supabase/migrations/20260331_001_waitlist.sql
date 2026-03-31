create extension if not exists "pgcrypto";

create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  role text not null check (role in ('parent', 'child')),
  child_age integer null check (child_age between 8 and 15),
  created_at timestamptz not null default now()
);

alter table public.waitlist enable row level security;

drop policy if exists "waitlist_insert_anon" on public.waitlist;
create policy "waitlist_insert_anon"
on public.waitlist
for insert
to anon, authenticated
with check (true);

drop policy if exists "waitlist_select_service" on public.waitlist;
create policy "waitlist_select_service"
on public.waitlist
for select
to authenticated
using (false);
