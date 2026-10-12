-- Idempotent pack apply: one row per user and pack token.

create table if not exists public.pack_applications (
  user_id uuid not null references public.users (id) on delete cascade,
  pack_token text not null,
  applied_at timestamptz not null default now(),
  primary key (user_id, pack_token)
);

create index if not exists pack_applications_token_idx
  on public.pack_applications (pack_token);

alter table public.pack_applications enable row level security;
