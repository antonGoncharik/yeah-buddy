-- FEAT-07: idempotent reminder sends per (user, kind, date)

create table if not exists public.reminder_log (
  user_id uuid not null references public.users (id) on delete cascade,
  kind text not null,
  date date not null,
  sent_at timestamptz not null default now(),
  primary key (user_id, kind, date)
);

create index if not exists reminder_log_date_idx
  on public.reminder_log (date desc);

alter table public.reminder_log enable row level security;

alter table public.user_settings
  add column if not exists weekly_digest_enabled boolean not null default true,
  add column if not exists monthly_report_enabled boolean not null default true,
  add column if not exists pr_push_enabled boolean not null default true,
  add column if not exists quiet_from smallint,
  add column if not exists quiet_to smallint;
