-- Вечерние напоминания бота: флаг, пояс, дата последней отправки.

alter table public.user_settings
  add column if not exists reminders_enabled boolean not null default true,
  add column if not exists timezone text not null default 'Europe/Moscow',
  add column if not exists reminded_on date;
