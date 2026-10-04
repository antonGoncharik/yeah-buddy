alter table public.workout_settings
  add column if not exists queue_preset_id text;
