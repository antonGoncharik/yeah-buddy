-- =========================================
-- Пакеты по ссылке: еда и зал отдельно
-- Снапшот шаблонов, не живой дневник
-- =========================================

create table if not exists public.share_packs (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.users(id) on delete cascade,
  source_pack_id uuid references public.share_packs(id) on delete set null,
  kind text not null check (kind in ('meals', 'workouts')),
  token text not null unique,
  title text not null,
  payload jsonb not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists share_packs_owner_created_idx
  on public.share_packs (owner_user_id, created_at desc);

create unique index if not exists share_packs_owner_source_uidx
  on public.share_packs (owner_user_id, source_pack_id)
  where source_pack_id is not null;

create trigger share_packs_set_updated_at
before update on public.share_packs
for each row execute function public.set_updated_at();

alter table public.share_packs enable row level security;
