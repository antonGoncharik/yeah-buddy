-- Источник первого входа (start_param), только при создании пользователя.

alter table public.users
  add column if not exists first_start_kind text check (
    first_start_kind in (
      'program',
      'pack',
      'coach',
      'buddy',
      'barbell',
      'meal'
    )
  ),
  add column if not exists first_start_ref text;
