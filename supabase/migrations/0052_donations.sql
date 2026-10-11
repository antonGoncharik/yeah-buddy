-- Учёт Telegram Stars донатов.

create table if not exists public.donations (
  id bigserial primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  stars integer not null check (stars > 0),
  telegram_payment_charge_id text not null unique,
  created_at timestamptz not null default now()
);

create index if not exists donations_user_created_at_idx
  on public.donations (user_id, created_at desc);

alter table public.donations enable row level security;
