-- Именованные приёмы: сохранённый состав рядом с «как вчера».
-- Снапшоты, как у meal_items: правка продукта не меняет сохранённый приём.

create table if not exists public.named_meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  meal_type text not null check (
    meal_type in (
      'breakfast',
      'lunch',
      'snack',
      'dinner',
      'pre_workout',
      'post_workout'
    )
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists named_meals_user_name_idx
  on public.named_meals (user_id, lower(name));

create index if not exists named_meals_user_id_idx
  on public.named_meals(user_id);

create table if not exists public.named_meal_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  named_meal_id uuid not null references public.named_meals(id) on delete cascade,
  food_id uuid references public.foods(id) on delete set null,
  name_snapshot text not null,
  grams numeric(8,2) not null check (grams > 0),
  protein numeric(8,2) not null default 0,
  fat numeric(8,2) not null default 0,
  carbs numeric(8,2) not null default 0,
  kcal numeric(10,2) not null default 0,
  per_100_snapshot jsonb not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists named_meal_items_named_meal_id_idx
  on public.named_meal_items(named_meal_id);

create trigger named_meals_set_updated_at
before update on public.named_meals
for each row execute function public.set_updated_at();

alter table public.named_meals enable row level security;
alter table public.named_meal_items enable row level security;
