-- Кто ты, цель и стаж: откуда посчитали белок и примерные максимумы. Пусто у старых аккаунтов.
alter table public.user_settings
  add column if not exists sex text
  check (sex is null or sex in ('male', 'female'));

alter table public.user_settings
  add column if not exists goal text
  check (goal is null or goal in ('lose', 'keep', 'gain'));

alter table public.user_settings
  add column if not exists training_age text
  check (
    training_age is null
    or training_age in ('beginner', 'year', 'years')
  );
