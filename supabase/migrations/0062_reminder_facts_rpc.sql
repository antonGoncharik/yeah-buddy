-- Batch evening reminder facts for one user/day (used from SQL dashboards; app uses TS batch).

create or replace function public.reminder_evening_facts(
  p_user_id uuid,
  p_date date
)
returns jsonb
language sql
stable
as $$
  select jsonb_build_object(
    'food_logged',
    exists (
      select 1
      from public.days d
      join public.meals m on m.day_id = d.id
      join public.meal_items mi on mi.meal_id = m.id
      where d.user_id = p_user_id
        and d.date = p_date
      limit 1
    ),
    'is_training_day',
    (
      select d.is_training_day
      from public.days d
      where d.user_id = p_user_id
        and d.date = p_date
      limit 1
    ),
    'session_status',
    (
      select ws.status
      from public.workout_sessions ws
      where ws.user_id = p_user_id
        and ws.session_date = p_date
      order by ws.created_at desc
      limit 1
    ),
    'fact_protein',
    coalesce(
      (
        select d.fact_protein
        from public.days d
        where d.user_id = p_user_id
          and d.date = p_date
        limit 1
      ),
      0
    ),
    'target_protein',
    coalesce(
      (
        select d.target_protein
        from public.days d
        where d.user_id = p_user_id
          and d.date = p_date
        limit 1
      ),
      0
    )
  );
$$;
