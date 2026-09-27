-- Временный доступ тренера к живому дневнику. Только чтение на сервере:
-- писать в чужие дни эта таблица не даёт, её читает отдельный загрузчик.

create table if not exists public.coach_grants (
  id uuid primary key default gen_random_uuid(),
  athlete_user_id uuid not null references public.users(id) on delete cascade,
  token text not null unique,
  coach_user_id uuid references public.users(id) on delete cascade,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  claimed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists coach_grants_athlete_idx
  on public.coach_grants (athlete_user_id, created_at desc);

create index if not exists coach_grants_coach_idx
  on public.coach_grants (coach_user_id, created_at desc)
  where coach_user_id is not null;

alter table public.coach_grants enable row level security;
