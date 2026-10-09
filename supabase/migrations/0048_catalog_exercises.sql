-- Справочник упражнений (техника, медиа). Личные exercises ссылаются на выбранную запись.

create table if not exists public.catalog_exercises (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  source_exercise_id text not null,
  name_en text not null,
  name_ru text,
  equipment text,
  body_part text,
  gif_path text not null,
  image_path text not null,
  instruction_steps jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source, source_exercise_id)
);

create index if not exists catalog_exercises_name_en_idx
  on public.catalog_exercises (name_en);

create index if not exists catalog_exercises_name_ru_idx
  on public.catalog_exercises (name_ru);

create trigger catalog_exercises_set_updated_at
before update on public.catalog_exercises
for each row execute function public.set_updated_at();

alter table public.catalog_exercises enable row level security;

alter table public.exercises
  add column if not exists catalog_exercise_id uuid
    references public.catalog_exercises(id) on delete set null;

create index if not exists exercises_catalog_exercise_id_idx
  on public.exercises (catalog_exercise_id)
  where catalog_exercise_id is not null;
