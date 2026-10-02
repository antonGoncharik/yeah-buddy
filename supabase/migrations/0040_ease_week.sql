-- Три «не пошло» подряд можно ответить один раз: открыть лёгкую неделю
-- или снизить рабочий вес. Повтор на той же тренировке не спрашиваем.

alter table public.workout_sessions
  add column if not exists ease_applied boolean not null default false;
