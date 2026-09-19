-- Первое срабатывание шага воронки на человека. Без еды, весов и telegram_id.

create table if not exists public.funnel_events (
  user_id uuid not null references public.users(id) on delete cascade,
  event text not null check (
    event in (
      'onboarding_done',
      'first_food',
      'first_session',
      'share',
      'program_start'
    )
  ),
  created_at timestamptz not null default now(),
  primary key (user_id, event)
);

alter table public.funnel_events enable row level security;
