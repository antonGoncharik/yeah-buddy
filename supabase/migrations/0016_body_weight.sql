-- Вес тела: одна цифра на календарный день еды.
-- Не копируется из вчера. Для кривых и разбора — last-known на дату.

alter table public.days
  add column if not exists body_weight numeric(5,1)
  check (
    body_weight is null
    or (body_weight >= 20 and body_weight <= 400)
  );
