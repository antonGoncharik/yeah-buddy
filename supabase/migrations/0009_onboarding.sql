-- Онбординг: флаг прохождения. Существующие дневники не гоняем по мастеру.

alter table public.user_settings
  add column if not exists onboarding_completed_at timestamptz;

update public.user_settings as settings
set onboarding_completed_at = now()
where settings.onboarding_completed_at is null
  and (
    exists (
      select 1
      from public.days as day
      where day.user_id = settings.user_id
    )
    or exists (
      select 1
      from public.workout_sessions as session
      where session.user_id = settings.user_id
    )
  );
