-- События продукта с произвольными props (без PII в коде приложения).

create table if not exists public.product_events (
  id bigserial primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  event text not null,
  props jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists product_events_event_created_at_idx
  on public.product_events (event, created_at desc);

create index if not exists product_events_user_created_at_idx
  on public.product_events (user_id, created_at desc);

alter table public.product_events enable row level security;
