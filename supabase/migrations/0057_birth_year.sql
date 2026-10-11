alter table public.user_settings
  add column if not exists birth_year smallint
  check (
    birth_year is null
    or (birth_year >= 1940 and birth_year <= 2015)
  );
