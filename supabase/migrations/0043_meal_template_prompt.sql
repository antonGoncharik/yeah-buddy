alter table public.user_settings
  add column if not exists meal_template_fill_prompt_dismissed boolean not null default false;
