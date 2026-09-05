-- Зал и стол в один день: две записи на дату, круг шаблонов не занимает стол.

alter table public.workout_sessions
  drop constraint if exists workout_sessions_user_id_session_date_key;

alter table public.workout_sessions
  drop constraint if exists workout_sessions_user_id_session_date_kind_key;

alter table public.workout_sessions
  add column if not exists kind text;

update public.workout_sessions
set kind = 'gym'
where kind is null;

alter table public.workout_sessions
  alter column kind set default 'gym';

alter table public.workout_sessions
  alter column kind set not null;

alter table public.workout_sessions
  drop constraint if exists workout_sessions_kind_check;

alter table public.workout_sessions
  add constraint workout_sessions_kind_check
  check (kind in ('gym', 'table'));

alter table public.workout_sessions
  drop constraint if exists workout_sessions_user_date_kind_key;

alter table public.workout_sessions
  add constraint workout_sessions_user_date_kind_key
  unique (user_id, session_date, kind);
