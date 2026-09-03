-- =========================================
-- Модуль тренировок: упражнения сессии и подходы
-- =========================================

create table if not exists public.session_exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  session_id uuid not null references public.workout_sessions(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete restrict,
  sort_order integer not null default 0,
  max_weight numeric(6,2) not null check (max_weight > 0),
  created_at timestamptz not null default now(),
  unique (session_id, exercise_id)
);

create index if not exists session_exercises_session_id_idx
  on public.session_exercises(session_id);

create table if not exists public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  session_exercise_id uuid not null references public.session_exercises(id) on delete cascade,
  set_type text not null check (set_type in ('warmup', 'work')),
  set_number integer not null check (set_number > 0),
  planned_weight numeric(6,2),
  planned_reps integer,
  planned_seconds numeric(4,1),
  actual_weight numeric(6,2),
  actual_reps integer,
  actual_seconds numeric(4,1),
  is_completed boolean not null default false,
  created_at timestamptz not null default now(),
  unique (session_exercise_id, set_number)
);

create index if not exists workout_sets_session_exercise_id_idx
  on public.workout_sets(session_exercise_id);

alter table public.session_exercises enable row level security;
alter table public.workout_sets enable row level security;
