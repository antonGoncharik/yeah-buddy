-- =========================================
-- Модуль тренировок: макроциклы и фазы
-- =========================================

create table if not exists public.macro_cycles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  number integer not null check (number > 0),
  start_date date not null,
  end_date date,
  status text not null check (status in ('current', 'completed')),
  note text,
  created_at timestamptz not null default now(),
  unique (user_id, number)
);

create index if not exists macro_cycles_user_id_idx
  on public.macro_cycles(user_id);

create unique index if not exists macro_cycles_one_current_idx
  on public.macro_cycles(user_id)
  where status = 'current';

create table if not exists public.workout_phases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  macro_cycle_id uuid not null references public.macro_cycles(id) on delete cascade,
  phase_type text not null check (
    phase_type in ('ramp', 'volume', 'peak', 'deload')
  ),
  start_date date not null,
  end_date date,
  status text not null check (status in ('current', 'completed')),
  sort_order integer not null check (sort_order between 1 and 4),
  created_at timestamptz not null default now(),
  unique (macro_cycle_id, phase_type)
);

create index if not exists workout_phases_macro_cycle_id_idx
  on public.workout_phases(macro_cycle_id);

create unique index if not exists workout_phases_one_current_idx
  on public.workout_phases(user_id)
  where status = 'current';

create table if not exists public.phase_maxes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  phase_id uuid not null references public.workout_phases(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  max_weight numeric(6,2) not null check (max_weight > 0),
  source text not null check (source in ('auto', 'manual')),
  set_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists phase_maxes_phase_id_idx
  on public.phase_maxes(phase_id);

create index if not exists phase_maxes_exercise_id_idx
  on public.phase_maxes(exercise_id);

alter table public.global_maxes
  drop constraint if exists global_maxes_phase_id_fkey;

alter table public.global_maxes
  add constraint global_maxes_phase_id_fkey
  foreign key (phase_id) references public.workout_phases(id) on delete set null;

alter table public.macro_cycles enable row level security;
alter table public.workout_phases enable row level security;
alter table public.phase_maxes enable row level security;
