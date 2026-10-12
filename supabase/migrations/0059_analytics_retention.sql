-- Retention cohorts, feature usage, AI/reminder rollups, event allowlist.

alter table public.product_events
  drop constraint if exists product_events_event_check;

alter table public.product_events
  add constraint product_events_event_check check (
    event in (
      'onboarding_step_view',
      'onboarding_step_complete',
      'energy_offer_shown',
      'energy_offer_applied',
      'energy_offer_dismissed',
      'muscles_view',
      'muscle_map_opened',
      'muscle_map_action',
      'sync_failed',
      'reminder_opened',
      'food_logged',
      'workout_started',
      'workout_completed',
      'share_publish',
      'share_send',
      'pack_apply',
      'coach_claim',
      'buddy_claim',
      'reminder_sent',
      'reminder_blocked',
      'ai_request',
      'ai_failed',
      'ai_empty',
      'landing_cta_click'
    )
  );

create or replace view public.analytics_retention_weekly as
with cohort as (
  select
    us.user_id,
    date_trunc('week', us.onboarding_completed_at)::date as cohort_week,
    us.onboarding_completed_at::date as cohort_date
  from public.user_settings us
  where us.onboarding_completed_at is not null
),
activity as (
  select distinct
    pe.user_id,
    pe.created_at::date as activity_date
  from public.product_events pe
  where pe.event in ('food_logged', 'workout_completed')
    and pe.user_id is not null
),
flags as (
  select
    c.user_id,
    c.cohort_week,
    max(
      case
        when a.activity_date = c.cohort_date + 1 then 1
        else 0
      end
    ) as active_d1,
    max(
      case
        when a.activity_date between c.cohort_date + 1 and c.cohort_date + 7 then 1
        else 0
      end
    ) as active_d7,
    max(
      case
        when a.activity_date between c.cohort_date + 1 and c.cohort_date + 30 then 1
        else 0
      end
    ) as active_d30
  from cohort c
  left join activity a on a.user_id = c.user_id
  group by c.user_id, c.cohort_week, c.cohort_date
)
select
  cohort_week,
  count(*)::int as cohort_size,
  round(avg(active_d1)::numeric, 4) as d1_rate,
  round(avg(active_d7)::numeric, 4) as d7_rate,
  round(avg(active_d30)::numeric, 4) as d30_rate
from flags
group by cohort_week
order by cohort_week;

create or replace view public.analytics_ai_daily as
select
  created_at::date as day,
  coalesce(props->>'kind', 'unknown') as kind,
  count(*) filter (where event = 'ai_request')::int as requests,
  count(*) filter (
    where event = 'ai_request'
      and coalesce((props->>'ok')::boolean, false) = false
  )::int as request_errors,
  count(*) filter (where event = 'ai_failed')::int as failed,
  count(*) filter (where event = 'ai_empty')::int as empty_responses,
  count(*) filter (
    where event = 'ai_request'
      and coalesce(props->>'ok', '') = 'false'
      and props->>'kind' is not null
  )::int as quota_or_error
from public.product_events
where event in ('ai_request', 'ai_failed', 'ai_empty')
group by 1, 2
order by 1 desc, 2;

create or replace view public.analytics_reminders as
select
  created_at::date as day,
  count(*) filter (where event = 'reminder_sent')::int as sent,
  count(*) filter (where event = 'reminder_blocked')::int as blocked,
  count(*) filter (where event = 'reminder_opened')::int as opened,
  count(*) filter (
    where event = 'reminder_sent'
      and props->>'kind' = 'midday'
  )::int as midday_sent,
  count(*) filter (
    where event = 'reminder_sent'
      and props->>'kind' = 'evening'
  )::int as evening_sent
from public.product_events
where event in ('reminder_sent', 'reminder_blocked', 'reminder_opened')
group by 1
order by 1 desc;

create or replace view public.analytics_features as
select
  count(distinct user_id) filter (
    where event = 'coach_claim'
      and created_at >= now() - interval '30 days'
  )::int as coach_users_30d,
  count(distinct user_id) filter (
    where event = 'buddy_claim'
      and created_at >= now() - interval '30 days'
  )::int as buddy_users_30d,
  count(distinct user_id) filter (
    where event = 'pack_apply'
      and created_at >= now() - interval '30 days'
  )::int as pack_users_30d,
  count(distinct user_id) filter (
    where event = 'food_logged'
      and props->>'method' = 'barcode'
      and created_at >= now() - interval '30 days'
  )::int as barcode_users_30d,
  count(distinct user_id) filter (
    where event = 'food_logged'
      and props->>'method' = 'plate'
      and created_at >= now() - interval '30 days'
  )::int as plate_users_30d,
  count(distinct user_id) filter (
    where event = 'food_logged'
      and props->>'method' = 'dictate'
      and created_at >= now() - interval '30 days'
  )::int as dictate_users_30d,
  count(distinct user_id) filter (
    where event in ('muscles_view', 'muscle_map_opened')
      and created_at >= now() - interval '30 days'
  )::int as muscle_map_users_30d
from public.product_events;
