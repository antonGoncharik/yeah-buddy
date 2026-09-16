-- Разбор «Как прошло» за 90 дней.

alter table public.review_snapshots
  drop constraint if exists review_snapshots_range_check;

alter table public.review_snapshots
  add constraint review_snapshots_range_check
  check (range in (14, 30, 90));
