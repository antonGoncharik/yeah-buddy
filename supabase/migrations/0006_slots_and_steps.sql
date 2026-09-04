-- Слот, шаг и пресет разминки на упражнении.
-- Слот сессии для ротации A → статика → B → C.

alter table public.exercises
  add column if not exists weight_step numeric(6,2) not null default 2.5
    check (weight_step > 0);

alter table public.exercises
  add column if not exists formula_preset text not null default 'barbell'
    check (formula_preset in ('barbell', 'cable', 'cable_short', 'none'));

alter table public.exercises
  add column if not exists slot text
    check (slot is null or slot in ('a', 'b', 'c'));

alter table public.workout_sessions
  add column if not exists slot text
    check (slot is null or slot in ('a', 'b', 'c', 'static'));
