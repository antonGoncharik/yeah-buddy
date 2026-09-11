-- Снимок разбора: последний текст 14/30 дней, чтобы сравнить со следующим.

create table if not exists public.review_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  range smallint not null check (range in (14, 30)),
  period_from date not null,
  period_to date not null,
  headline text not null,
  observations jsonb not null,
  watch jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists review_snapshots_user_range_created_idx
  on public.review_snapshots (user_id, range, created_at desc);

alter table public.review_snapshots enable row level security;
