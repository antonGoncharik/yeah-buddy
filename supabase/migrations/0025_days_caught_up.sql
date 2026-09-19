-- Forgotten days in the 7-day catch-up window are marked when filled late.

alter table public.days
  add column if not exists caught_up boolean not null default false;
