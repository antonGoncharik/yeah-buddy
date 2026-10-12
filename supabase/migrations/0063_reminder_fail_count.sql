-- Consecutive Telegram send failures per user (evening/midday reminders).

alter table public.user_settings
  add column if not exists reminder_fail_count smallint not null default 0;

comment on column public.user_settings.reminder_fail_count is
  'Increments on failed reminder send; reset on success; pauses after threshold in app cron.';
