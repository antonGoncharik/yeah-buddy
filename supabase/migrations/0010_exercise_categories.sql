-- Категория упражнения: только база и изоляция.
-- Старые строки armwrestling читаются как база.

update public.exercises
set category = 'base'
where category = 'armwrestling';

do $$
declare
  constraint_name text;
begin
  select con.conname into constraint_name
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  join pg_namespace nsp on nsp.oid = rel.relnamespace
  where nsp.nspname = 'public'
    and rel.relname = 'exercises'
    and con.contype = 'c'
    and pg_get_constraintdef(con.oid) ilike '%armwrestling%';

  if constraint_name is not null then
    execute format(
      'alter table public.exercises drop constraint %I',
      constraint_name
    );
  end if;
end $$;

alter table public.exercises
  drop constraint if exists exercises_category_check;

alter table public.exercises
  add constraint exercises_category_check
  check (category in ('base', 'isolation'));
