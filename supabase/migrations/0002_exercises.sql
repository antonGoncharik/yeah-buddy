-- =========================================
-- Модуль тренировок: упражнения и рекорды
-- =========================================

-- -----------------------------------------
-- Настройки формул и округления
-- -----------------------------------------
create table if not exists public.workout_settings (
  user_id uuid primary key references public.users(id) on delete cascade,
  weight_step numeric(6,2) not null default 2.5 check (weight_step > 0),
  max_increase_percent numeric(6,2) not null default 5 check (max_increase_percent >= 0),
  formulas jsonb not null,
  updated_at timestamptz not null default now()
);

-- -----------------------------------------
-- Упражнения
-- -----------------------------------------
create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  short_name text,
  category text not null check (
    category in ('base', 'armwrestling', 'isolation')
  ),
  workout_type text not null check (
    workout_type in ('dynamic', 'static', 'both')
  ),
  unit text not null check (
    unit in ('reps', 'seconds')
  ),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create index if not exists exercises_user_id_idx
  on public.exercises(user_id);

create index if not exists exercises_user_active_idx
  on public.exercises(user_id, is_active);

-- -----------------------------------------
-- Глобальные максимумы (история рекордов)
-- -----------------------------------------
create table if not exists public.global_maxes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  max_weight numeric(6,2) not null check (max_weight > 0),
  achieved_at date not null,
  phase_id uuid,
  workout_session_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists global_maxes_exercise_id_idx
  on public.global_maxes(exercise_id);

create index if not exists global_maxes_user_exercise_idx
  on public.global_maxes(user_id, exercise_id, achieved_at desc);

-- -----------------------------------------
-- updated_at
-- -----------------------------------------
create trigger workout_settings_set_updated_at
before update on public.workout_settings
for each row execute function public.set_updated_at();

create trigger exercises_set_updated_at
before update on public.exercises
for each row execute function public.set_updated_at();

-- -----------------------------------------
-- RLS: клиент в базу не ходит
-- -----------------------------------------
alter table public.workout_settings enable row level security;
alter table public.exercises enable row level security;
alter table public.global_maxes enable row level security;
