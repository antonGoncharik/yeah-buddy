-- Выход сырого/сухого в готовое: своя пара граммов, не каталог мира.
-- Шаблон остаётся в состоянии продукта; факт можно писать в готовом.

alter table public.foods
  add column if not exists yield_from_g numeric(8,2);

alter table public.foods
  add column if not exists yield_to_g numeric(8,2);

alter table public.foods
  drop constraint if exists foods_yield_pair_check;

alter table public.foods
  add constraint foods_yield_pair_check check (
    (yield_from_g is null and yield_to_g is null)
    or (
      yield_from_g is not null
      and yield_to_g is not null
      and yield_from_g > 0
      and yield_to_g > 0
      and state in ('raw', 'dry')
    )
  );
