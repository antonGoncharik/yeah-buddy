-- Общий справочник продуктов (Едоставка и т.п.).
-- В личный foods попадает только выбранное человеком.

create table if not exists public.catalog_foods (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  source_product_id text not null,
  name text not null,
  brand text,
  pack_weight_g numeric(8,2),
  protein_per_100 numeric(8,2) not null default 0,
  fat_per_100 numeric(8,2) not null default 0,
  carbs_per_100 numeric(8,2) not null default 0,
  kcal_per_100 numeric(10,2) generated always as (
    (protein_per_100 * 4) + (fat_per_100 * 9) + (carbs_per_100 * 4)
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source, source_product_id)
);

create index if not exists catalog_foods_name_idx
  on public.catalog_foods (name);

create index if not exists catalog_foods_brand_idx
  on public.catalog_foods (brand);

create trigger catalog_foods_set_updated_at
before update on public.catalog_foods
for each row execute function public.set_updated_at();

alter table public.catalog_foods enable row level security;

alter table public.foods
  add column if not exists catalog_food_id uuid
    references public.catalog_foods(id) on delete set null;

create unique index if not exists foods_user_catalog_food_idx
  on public.foods (user_id, catalog_food_id)
  where catalog_food_id is not null;
