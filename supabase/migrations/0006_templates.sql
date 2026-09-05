-- Шаблоны тренировок и круг.
-- Состав сессии берётся из шаблона, не из слота упражнения.
-- Макроцикл на сессии необязателен: простая программа без фаз.

create table if not exists public.workout_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('dynamic', 'static')),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workout_templates_user_id_idx
  on public.workout_templates(user_id);

create table if not exists public.workout_template_exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  template_id uuid not null references public.workout_templates(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete restrict,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (template_id, exercise_id)
);

create index if not exists workout_template_exercises_template_id_idx
  on public.workout_template_exercises(template_id);

alter table public.workout_sessions
  add column if not exists template_id uuid
    references public.workout_templates(id) on delete set null;

create trigger workout_templates_set_updated_at
before update on public.workout_templates
for each row execute function public.set_updated_at();

alter table public.workout_templates enable row level security;
alter table public.workout_template_exercises enable row level security;
