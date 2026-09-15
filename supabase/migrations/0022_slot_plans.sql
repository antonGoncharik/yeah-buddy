-- =========================================
-- Схема подходов на слоте, линейки весов, интенсивность и RIR.
-- Любая программа из таблицы: у каждого упражнения в тренировке своя
-- схема, вес идёт от рабочего, от линейки, фиксированный или по самочувствию.
-- =========================================

-- Слот шаблона: своя схема подходов (null = общий план подходов).
alter table public.workout_template_exercises
  add column if not exists plan jsonb;

-- Линейка весов по упражнению: явный ряд шагов и текущая позиция.
create table if not exists public.exercise_tracks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  name text,
  steps jsonb not null default '[]'::jsonb,
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, exercise_id)
);

create index if not exists exercise_tracks_user_id_idx
  on public.exercise_tracks(user_id);

drop trigger if exists exercise_tracks_set_updated_at on public.exercise_tracks;
create trigger exercise_tracks_set_updated_at
before update on public.exercise_tracks
for each row execute function public.set_updated_at();

alter table public.exercise_tracks enable row level security;

-- Упражнение сессии: рабочий вес может отсутствовать (линейка, кг, по самочувствию),
-- плюс снимок интенсивности, заметки и шага линейки на момент планирования.
alter table public.session_exercises
  alter column max_weight drop not null;

alter table public.session_exercises
  drop constraint if exists session_exercises_max_weight_check;

alter table public.session_exercises
  add constraint session_exercises_max_weight_check
  check (max_weight is null or max_weight > 0);

alter table public.session_exercises
  add column if not exists intensity text check (
    intensity is null or intensity in ('heavy', 'light')
  ),
  add column if not exists note text,
  add column if not exists track_id uuid references public.exercise_tracks(id) on delete set null,
  add column if not exists track_step integer check (track_step is null or track_step >= 0);

-- Подход: диапазон повторов, плановый и фактический запас (RIR).
alter table public.workout_sets
  add column if not exists planned_reps_to integer check (
    planned_reps_to is null or planned_reps_to > 0
  ),
  add column if not exists planned_rir smallint check (
    planned_rir is null or planned_rir between 0 and 10
  ),
  add column if not exists actual_rir smallint check (
    actual_rir is null or actual_rir between 0 and 10
  );
