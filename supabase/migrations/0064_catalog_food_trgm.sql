-- FEAT-06: trigram catalog search + popularity ranking

create extension if not exists pg_trgm;

alter table public.catalog_foods
  add column if not exists search_name text generated always as (
    lower(
      regexp_replace(
        replace(coalesce(name, '') || ' ' || coalesce(brand, ''), 'ё', 'е'),
        '[^[:alnum:][:space:]]',
        ' ',
        'g'
      )
    )
  ) stored;

create index if not exists catalog_foods_search_name_trgm_idx
  on public.catalog_foods using gin (search_name gin_trgm_ops);

create or replace function public.search_catalog_foods(
  p_query text,
  p_exclude_ids uuid[] default '{}',
  p_limit int default 40
)
returns setof public.catalog_foods
language sql
stable
security definer
set search_path = public
as $$
  with needle as (
    select lower(replace(trim(p_query), 'ё', 'е')) as q
  ),
  ranked as (
    select
      cf.id,
      coalesce(u.uses, 0) as use_count,
      similarity(cf.search_name, (select q from needle)) as sim
    from public.catalog_foods cf
    cross join needle
    left join (
      select catalog_food_id, count(*)::int as uses
      from public.foods
      where catalog_food_id is not null
      group by catalog_food_id
    ) u on u.catalog_food_id = cf.id
    where
      cf.id <> all (coalesce(p_exclude_ids, '{}'))
      and length((select q from needle)) >= 2
      and (
        cf.search_name ilike '%' || (select q from needle) || '%'
        or cf.search_name % (select q from needle)
      )
  )
  select cf.*
  from ranked r
  join public.catalog_foods cf on cf.id = r.id
  order by r.sim desc, r.use_count desc, cf.name asc
  limit greatest(1, least(p_limit, 120));
$$;

revoke all on function public.search_catalog_foods(text, uuid[], int) from public;
grant execute on function public.search_catalog_foods(text, uuid[], int) to service_role;
