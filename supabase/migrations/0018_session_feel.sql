-- =========================================
-- Как прошло: легко / впритык / не пошло
-- =========================================

alter table public.workout_sessions
  add column if not exists feel text check (
    feel is null or feel in ('easy', 'close', 'miss')
  );
