-- =========================================
-- Чистый MVP: дневник питания
-- Только своя база продуктов
-- =========================================

create extension if not exists "pgcrypto";

-- -----------------------------------------
-- Пользователи
-- -----------------------------------------
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  telegram_id bigint not null unique,
  username text,
  first_name text,
  language_code text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists users_telegram_id_idx
  on public.users(telegram_id);

-- -----------------------------------------
-- Настройки пользователя
-- -----------------------------------------
create table if not exists public.user_settings (
  user_id uuid primary key references public.users(id) on delete cascade,
  rest_protein numeric(8,2) not null default 200,
  rest_fat numeric(8,2) not null default 70,
  rest_carbs numeric(8,2) not null default 130,
  training_protein numeric(8,2) not null default 200,
  training_fat numeric(8,2) not null default 70,
  training_carbs numeric(8,2) not null default 200,
  updated_at timestamptz not null default now()
);

-- -----------------------------------------
-- Продукты
-- -----------------------------------------
create table if not exists public.foods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  brand text,
  state text not null default 'as_is' check (
    state in ('raw', 'dry', 'cooked', 'as_is', 'liquid')
  ),
  protein_per_100 numeric(8,2) not null default 0,
  fat_per_100 numeric(8,2) not null default 0,
  carbs_per_100 numeric(8,2) not null default 0,
  kcal_per_100 numeric(8,2) not null default 0,
  default_portion_g numeric(8,2),
  default_portion_label text,
  is_favorite boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists foods_user_id_idx
  on public.foods(user_id);

create index if not exists foods_user_name_idx
  on public.foods(user_id, name);

-- -----------------------------------------
-- Дни питания
-- -----------------------------------------
create table if not exists public.days (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  date date not null,
  is_training_day boolean not null default false,
  target_protein numeric(8,2) not null default 200,
  target_fat numeric(8,2) not null default 70,
  target_carbs numeric(8,2) not null default 130,
  target_kcal numeric(10,2) generated always as (
    (target_protein * 4) + (target_fat * 9) + (target_carbs * 4)
  ) stored,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, date)
);

create index if not exists days_user_date_idx
  on public.days(user_id, date);

-- -----------------------------------------
-- Приёмы пищи
-- -----------------------------------------
create table if not exists public.meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  day_id uuid not null references public.days(id) on delete cascade,
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
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique(day_id, meal_type)
);

create index if not exists meals_day_id_idx
  on public.meals(day_id);

-- -----------------------------------------
-- Продукты в приёме пищи
-- -----------------------------------------
create table if not exists public.meal_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  meal_id uuid not null references public.meals(id) on delete cascade,
  food_id uuid references public.foods(id) on delete set null,
  name_snapshot text not null,
  grams numeric(8,2) not null check (grams > 0),
  protein numeric(8,2) not null default 0,
  fat numeric(8,2) not null default 0,
  carbs numeric(8,2) not null default 0,
  kcal numeric(10,2) not null default 0,
  per_100_snapshot jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists meal_items_meal_id_idx
  on public.meal_items(meal_id);

create index if not exists meal_items_food_id_idx
  on public.meal_items(food_id);

-- -----------------------------------------
-- Шаблоны дней
-- -----------------------------------------
create table if not exists public.meal_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  day_type text not null check (
    day_type in ('rest', 'training')
  ),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists meal_templates_user_id_idx
  on public.meal_templates(user_id);

-- -----------------------------------------
-- Состав шаблонов дней
-- -----------------------------------------
create table if not exists public.meal_template_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  template_id uuid not null references public.meal_templates(id) on delete cascade,
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
  food_id uuid not null references public.foods(id) on delete cascade,
  grams numeric(8,2) not null check (grams > 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists meal_template_items_template_id_idx
  on public.meal_template_items(template_id);

-- -----------------------------------------
-- updated_at триггеры
-- -----------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger users_set_updated_at
before update on public.users
for each row execute function public.set_updated_at();

create trigger user_settings_set_updated_at
before update on public.user_settings
for each row execute function public.set_updated_at();

create trigger foods_set_updated_at
before update on public.foods
for each row execute function public.set_updated_at();

create trigger days_set_updated_at
before update on public.days
for each row execute function public.set_updated_at();

create trigger meal_items_set_updated_at
before update on public.meal_items
for each row execute function public.set_updated_at();

create trigger meal_templates_set_updated_at
before update on public.meal_templates
for each row execute function public.set_updated_at();

-- -----------------------------------------
-- RLS
-- -----------------------------------------
-- Клиент не должен ходить в базу напрямую.
-- Сервер использует service role key.
alter table public.users enable row level security;
alter table public.user_settings enable row level security;
alter table public.foods enable row level security;
alter table public.days enable row level security;
alter table public.meals enable row level security;
alter table public.meal_items enable row level security;
alter table public.meal_templates enable row level security;
alter table public.meal_template_items enable row level security;
