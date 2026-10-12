-- Separate switches for weigh-in and streak notices. Default on matches the previous always-send behavior.

alter table public.user_settings
  add column if not exists weigh_in_enabled boolean not null default true,
  add column if not exists streak_reminder_enabled boolean not null default true;
