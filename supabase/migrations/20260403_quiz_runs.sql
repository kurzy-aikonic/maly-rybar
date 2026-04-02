-- Historie dokoncenych kvizu (sync pri prihlaseni)
create table if not exists public.quiz_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  score int not null check (score >= 0),
  max_score int not null check (max_score >= 1),
  question_count int not null check (question_count >= 1),
  is_premium boolean not null default false,
  created_at timestamptz not null default now(),
  constraint quiz_runs_score_vs_max check (score <= max_score)
);

create index if not exists quiz_runs_user_created_idx
on public.quiz_runs (user_id, created_at desc);

alter table public.quiz_runs enable row level security;

drop policy if exists "quiz_runs_select_own" on public.quiz_runs;
create policy "quiz_runs_select_own"
on public.quiz_runs for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "quiz_runs_insert_own" on public.quiz_runs;
create policy "quiz_runs_insert_own"
on public.quiz_runs for insert
to authenticated
with check (auth.uid() = user_id);
