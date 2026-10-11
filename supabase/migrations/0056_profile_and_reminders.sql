alter table public.user_settings
  add column if not exists height_cm numeric(5,1)
  check (height_cm is null or (height_cm >= 120 and height_cm <= 230));

alter table public.user_settings
  add column if not exists activity_level text
  check (
    activity_level is null
    or activity_level in ('low', 'moderate', 'high')
  );

alter table public.user_settings
  add column if not exists goal_pace text
  check (
    goal_pace is null
    or goal_pace in ('slow', 'normal', 'fast')
  );

alter table public.user_settings
  add column if not exists reminder_hour smallint not null default 21
  check (reminder_hour >= 17 and reminder_hour <= 23);

alter table public.user_settings
  add column if not exists review_cooldown_until timestamptz;
