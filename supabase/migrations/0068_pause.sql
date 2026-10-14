alter table public.user_settings
  add column if not exists pause_from date,
  add column if not exists pause_until date,
  add column if not exists pause_return_pending boolean not null default false,
  add column if not exists pause_lighten boolean not null default false;

alter table public.user_settings
  drop constraint if exists user_settings_pause_range_check;

alter table public.user_settings
  add constraint user_settings_pause_range_check
  check (
    (pause_from is null and pause_until is null)
    or (
      pause_from is not null
      and pause_until is not null
      and pause_until >= pause_from
    )
  );
