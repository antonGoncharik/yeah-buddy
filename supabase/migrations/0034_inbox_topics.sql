-- Тема письма автору и черновик, пока человек не выбрал.
-- Маршрут: на какое сообщение в чате автора отвечать.

create table if not exists public.inbox_threads (
  telegram_id bigint primary key,
  topic text check (topic in ('program', 'improve', 'change')),
  draft text check (draft is null or char_length(draft) <= 3500),
  updated_at timestamptz not null default now()
);

alter table public.inbox_threads enable row level security;

create table if not exists public.inbox_routes (
  admin_message_id bigint primary key,
  telegram_id bigint not null,
  created_at timestamptz not null default now()
);

alter table public.inbox_routes enable row level security;
