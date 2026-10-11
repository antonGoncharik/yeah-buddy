alter table public.global_maxes
  add column if not exists source text not null default 'manual'
  check (source in ('estimate', 'manual', 'session'));

update public.global_maxes
set source = 'session'
where workout_session_id is not null
  and source = 'manual';
