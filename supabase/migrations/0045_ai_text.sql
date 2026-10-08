-- Текстовый разбор еды. Своя квота, отдельный пул ключей.

alter table public.ai_usage
  drop constraint if exists ai_usage_kind_check;

alter table public.ai_usage
  add constraint ai_usage_kind_check
  check (kind in ('plate', 'review', 'dictate', 'text'));
