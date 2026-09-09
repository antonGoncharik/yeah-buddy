-- Пропуски очереди — отдельная колонка, не служебный ключ в jsonb схемы подходов.

alter table public.workout_settings
  add column if not exists skip_template_ids uuid[] not null default '{}';

update public.workout_settings as ws
set skip_template_ids = coalesce(
  (
    select array_agg(distinct x.id)
    from (
      select t.id::uuid as id
      from jsonb_array_elements_text(
        coalesce(ws.formulas -> '_skip_template_ids', '[]'::jsonb)
      ) as t(id)
      where t.id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    ) as x
  ),
  '{}'::uuid[]
);

update public.workout_settings
set formulas = formulas - '_skip_template_ids'
where formulas ? '_skip_template_ids';
