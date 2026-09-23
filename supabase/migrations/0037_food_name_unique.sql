-- One food name per user. Login seed used to race itself and leave
-- two «Куриное филе сырое» rows; collapse copies, then lock the rule.

create temporary table _food_name_losers on commit drop as
with ranked as (
  select
    f.id,
    f.user_id,
    lower(trim(f.name)) as name_key,
    row_number() over (
      partition by f.user_id, lower(trim(f.name))
      order by
        exists (
          select 1
          from public.meal_template_items t
          where t.food_id = f.id
        ) desc,
        exists (
          select 1 from public.meal_items m where m.food_id = f.id
        ) desc,
        exists (
          select 1
          from public.named_meal_items n
          where n.food_id = f.id
        ) desc,
        f.is_favorite desc,
        f.created_at asc,
        f.id asc
    ) as rn
  from public.foods f
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

delete from public.meal_template_items mti
using _food_name_losers l
where mti.food_id = l.id
  and exists (
    select 1
    from public.meal_template_items x
    where x.template_id = mti.template_id
      and x.meal_type = mti.meal_type
      and x.food_id = l.keeper_id
  );

update public.meal_template_items mti
set food_id = l.keeper_id
from _food_name_losers l
where mti.food_id = l.id;

update public.meal_items mi
set food_id = l.keeper_id
from _food_name_losers l
where mi.food_id = l.id;

update public.named_meal_items nmi
set food_id = l.keeper_id
from _food_name_losers l
where nmi.food_id = l.id;

delete from public.foods f
using _food_name_losers l
where f.id = l.id;

drop index if exists public.foods_user_name_idx;

create unique index if not exists foods_user_name_uidx
  on public.foods (user_id, lower(trim(name)));
