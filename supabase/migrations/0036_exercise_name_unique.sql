-- One exercise name per user. Login seed used to race itself and leave
-- two «Приседания со штангой» rows; collapse copies, then lock the rule.

create temporary table _exercise_name_losers on commit drop as
with ranked as (
  select
    e.id,
    e.user_id,
    lower(trim(e.name)) as name_key,
    row_number() over (
      partition by e.user_id, lower(trim(e.name))
      order by
        exists (
          select 1 from public.global_maxes g where g.exercise_id = e.id
        ) desc,
        exists (
          select 1
          from public.workout_template_exercises t
          where t.exercise_id = e.id
        ) desc,
        e.is_active desc,
        e.created_at asc,
        e.id asc
    ) as rn
  from public.exercises e
),
keepers as (
  select id, user_id, name_key from ranked where rn = 1
)
select r.id, r.user_id, r.name_key, k.id as keeper_id
from ranked r
join keepers k
  on k.user_id = r.user_id
 and k.name_key = r.name_key
where r.rn > 1;

delete from public.workout_template_exercises wte
using _exercise_name_losers l
where wte.exercise_id = l.id
  and exists (
    select 1
    from public.workout_template_exercises x
    where x.template_id = wte.template_id
      and x.exercise_id = l.keeper_id
  );

update public.workout_template_exercises wte
set exercise_id = l.keeper_id
from _exercise_name_losers l
where wte.exercise_id = l.id;

delete from public.session_exercises se
using _exercise_name_losers l
where se.exercise_id = l.id
  and exists (
    select 1
    from public.session_exercises x
    where x.session_id = se.session_id
      and x.exercise_id = l.keeper_id
  );

update public.session_exercises se
set exercise_id = l.keeper_id
from _exercise_name_losers l
where se.exercise_id = l.id;

delete from public.exercise_tracks et
using _exercise_name_losers l
where et.exercise_id = l.id
  and exists (
    select 1
    from public.exercise_tracks x
    where x.user_id = et.user_id
      and x.exercise_id = l.keeper_id
  );

update public.exercise_tracks et
set exercise_id = l.keeper_id
from _exercise_name_losers l
where et.exercise_id = l.id;

delete from public.phase_maxes pm
using _exercise_name_losers l
where pm.exercise_id = l.id
  and exists (
    select 1
    from public.phase_maxes x
    where x.phase_id = pm.phase_id
      and x.exercise_id = l.keeper_id
  );

update public.phase_maxes pm
set exercise_id = l.keeper_id
from _exercise_name_losers l
where pm.exercise_id = l.id;

update public.global_maxes gm
set exercise_id = l.keeper_id
from _exercise_name_losers l
where gm.exercise_id = l.id;

delete from public.exercises e
using _exercise_name_losers l
where e.id = l.id;

create unique index if not exists exercises_user_name_uidx
  on public.exercises (user_id, lower(trim(name)));
