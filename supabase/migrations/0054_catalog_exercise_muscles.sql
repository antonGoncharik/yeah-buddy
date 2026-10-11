-- ExerciseDB target + secondary muscles from yeah-buddy-exercises.json

alter table public.catalog_exercises
  add column if not exists target text,
  add column if not exists secondary_muscles text[] not null default '{}';

create index if not exists catalog_exercises_target_idx
  on public.catalog_exercises (target)
  where target is not null;
