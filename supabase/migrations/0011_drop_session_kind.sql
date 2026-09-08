-- Стол в продукте не создаём и не показываем. Одна сессия зала на дату.

delete from public.workout_sessions
where kind = 'table';

alter table public.workout_sessions
  drop constraint if exists workout_sessions_user_date_kind_key;

alter table public.workout_sessions
  drop constraint if exists workout_sessions_user_id_session_date_kind_key;

alter table public.workout_sessions
  drop constraint if exists workout_sessions_kind_check;

alter table public.workout_sessions
  drop column if exists kind;

alter table public.workout_sessions
  drop constraint if exists workout_sessions_user_id_session_date_key;

alter table public.workout_sessions
  add constraint workout_sessions_user_id_session_date_key
  unique (user_id, session_date);
