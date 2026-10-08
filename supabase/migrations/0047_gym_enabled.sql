alter table public.user_settings
  add column if not exists gym_enabled boolean not null default true;
