create table if not exists public.buddy_grants (
  id uuid primary key default gen_random_uuid(),
  athlete_user_id uuid not null references public.users(id) on delete cascade,
  token text not null unique,
  buddy_user_id uuid references public.users(id) on delete cascade,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  claimed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists buddy_grants_athlete_idx
  on public.buddy_grants (athlete_user_id, created_at desc);

create index if not exists buddy_grants_buddy_idx
  on public.buddy_grants (buddy_user_id, created_at desc)
  where buddy_user_id is not null;

alter table public.buddy_grants enable row level security;
