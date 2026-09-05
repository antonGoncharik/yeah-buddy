-- =========================================
-- Модуль тренировок: сессии
-- =========================================

create table if not exists public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  session_date date not null,
  macro_cycle_id uuid references public.macro_cycles(id) on delete set null,
  phase_id uuid references public.workout_phases(id) on delete set null,
  workout_type text not null check (
    workout_type in ('dynamic', 'static')
  ),
  status text not null check (
    status in ('planned', 'completed', 'skipped')
  ),
  note text,
  created_at timestamptz not null default now(),
  unique (user_id, session_date)
);

create index if not exists workout_sessions_user_date_idx
  on public.workout_sessions(user_id, session_date);

create index if not exists workout_sessions_phase_id_idx
  on public.workout_sessions(phase_id);

alter table public.global_maxes
  drop constraint if exists global_maxes_workout_session_id_fkey;

alter table public.global_maxes
  add constraint global_maxes_workout_session_id_fkey
  foreign key (workout_session_id) references public.workout_sessions(id)
  on delete set null;

alter table public.workout_sessions enable row level security;
