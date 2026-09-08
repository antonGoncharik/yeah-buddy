-- Нейтральные цели БЖУ для новых пользователей.
-- Существующие строки не трогаем.

alter table public.user_settings
  alter column rest_protein set default 120,
  alter column rest_fat set default 70,
  alter column rest_carbs set default 200,
  alter column training_protein set default 120,
  alter column training_fat set default 70,
  alter column training_carbs set default 250;

alter table public.days
  alter column target_protein set default 120,
  alter column target_fat set default 70,
  alter column target_carbs set default 200;
