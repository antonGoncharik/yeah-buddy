-- Скрытые программы, которые автор выдал этому человеку.
-- Общие программы сюда не пишутся: они и так в списке.
alter table public.user_settings
  add column if not exists granted_programs text[] not null default '{}';
