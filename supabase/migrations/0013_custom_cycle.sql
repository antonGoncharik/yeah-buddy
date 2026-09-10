-- Custom macrocycle phases: any key/name, not only ramp/volume/peak/deload.

alter table public.workout_phases
  drop constraint if exists workout_phases_phase_type_check;

alter table public.workout_phases
  drop constraint if exists workout_phases_sort_order_check;

alter table public.workout_phases
  add constraint workout_phases_sort_order_check
  check (sort_order > 0);

alter table public.workout_phases
  add column if not exists name text;
