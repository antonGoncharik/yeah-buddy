-- Талия: одна цифра на день, не каждый день. Не копируется из вчера.
alter table public.days
  add column if not exists waist_cm numeric(4,1)
  check (
    waist_cm is null
    or (waist_cm >= 40 and waist_cm <= 200)
  );

-- Сколько лет человек уже тренируется. Пусто — разбор про стаж не говорит.
alter table public.user_settings
  add column if not exists training_years smallint
  check (
    training_years is null
    or (training_years >= 0 and training_years <= 80)
  );
