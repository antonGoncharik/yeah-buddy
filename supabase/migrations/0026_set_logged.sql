-- Честный след: подход записан человеком или скопирован из плана кнопкой «Готово».

alter table public.workout_sets
  add column if not exists logged boolean not null default false;

update public.workout_sets
set logged = true
where is_completed
  and (
    actual_weight is distinct from planned_weight
    or actual_reps is distinct from planned_reps
    or actual_seconds is distinct from planned_seconds
    or actual_rir is distinct from planned_rir
  );
