-- Дневной счётчик вызовов тарелки и разбора. Ключи разные, квота тоже.

create table if not exists public.ai_usage (
  user_id uuid not null references public.users(id) on delete cascade,
  kind text not null check (kind in ('plate', 'review')),
  used_on date not null,
  count integer not null default 0 check (count >= 0),
  primary key (user_id, kind, used_on)
);

alter table public.ai_usage enable row level security;
