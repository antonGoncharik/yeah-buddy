-- =========================================
-- Модуль тренировок: расписание и сессии
-- =========================================

create table if not exists public.workout_schedule (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  day_of_week integer not null check (day_of_week between 1 and 7),
  workout_type text not null check (
    workout_type in ('dynamic', 'static', 'rest')
  ),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, day_of_week)
);

create index if not exists workout_schedule_user_id_idx
  on public.workout_schedule(user_id);

create table if not exists public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  session_date date not null,
  macro_cycle_id uuid not null references public.macro_cycles(id) on delete cascade,
  phase_id uuid not null references public.workout_phases(id) on delete cascade,
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

create trigger workout_schedule_set_updated_at
before update on public.workout_schedule
for each row execute function public.set_updated_at();

alter table public.workout_schedule enable row level security;
alter table public.workout_sessions enable row level security;
