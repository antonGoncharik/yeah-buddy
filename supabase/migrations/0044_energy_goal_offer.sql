alter table public.user_settings
  add column if not exists energy_goal_dismissed_kcal integer;
