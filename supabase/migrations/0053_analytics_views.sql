-- Сводки для SQL Editor / дашборда (без PII).

create or replace view public.analytics_activation_funnel as
select
  count(*) filter (where fe_onboarding.user_id is not null) as onboarding_done,
  count(*) filter (
    where fe_onboarding.user_id is not null
      and fe_food.user_id is not null
      and fe_food.created_at <= fe_onboarding.created_at + interval '1 day'
  ) as first_food_within_1d,
  count(*) filter (
    where fe_onboarding.user_id is not null
      and fe_food.user_id is not null
      and fe_food.created_at <= fe_onboarding.created_at + interval '7 days'
  ) as first_food_within_7d
from public.users u
left join public.funnel_events fe_onboarding
  on fe_onboarding.user_id = u.id
  and fe_onboarding.event = 'onboarding_done'
left join public.funnel_events fe_food
  on fe_food.user_id = u.id
  and fe_food.event = 'first_food';

create or replace view public.analytics_onboarding_steps as
select
  props->>'step' as step,
  count(*) filter (where event = 'onboarding_step_view') as views,
  count(*) filter (where event = 'onboarding_step_complete') as completes
from public.product_events
where event in ('onboarding_step_view', 'onboarding_step_complete')
group by 1
order by views desc;

create or replace view public.analytics_food_days_per_user_week as
with cohort as (
  select
    u.id as user_id,
    date_trunc('week', fe.created_at)::date as cohort_week
  from public.users u
  join public.funnel_events fe
    on fe.user_id = u.id
    and fe.event = 'onboarding_done'
),
food_days as (
  select
    pe.user_id,
    date_trunc('week', pe.created_at)::date as week,
    count(distinct pe.created_at::date) as days_with_food
  from public.product_events pe
  where pe.event = 'food_logged'
  group by 1, 2
)
select
  c.cohort_week,
  count(distinct c.user_id) as users,
  round(avg(fd.days_with_food)::numeric, 2) as avg_food_days_in_week
from cohort c
left join food_days fd
  on fd.user_id = c.user_id
  and fd.week = c.cohort_week
group by 1
order by 1;
