-- Evening/midday reminder cron: distinct timezones + candidate pages.

create index if not exists user_settings_reminder_cron_idx
  on public.user_settings (timezone)
  where reminders_enabled = true
    and onboarding_completed_at is not null;
