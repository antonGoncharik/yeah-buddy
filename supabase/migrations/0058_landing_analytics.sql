-- Anonymous landing CTA clicks and landing start attribution.

alter table public.product_events
  alter column user_id drop not null;

alter table public.users
  drop constraint if exists users_first_start_kind_check;

alter table public.users
  add constraint users_first_start_kind_check check (
    first_start_kind is null
    or first_start_kind in (
      'program',
      'pack',
      'coach',
      'buddy',
      'barbell',
      'meal',
      'landing'
    )
  );
