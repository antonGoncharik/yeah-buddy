-- =========================================
-- Маленький пак: один приём, не весь рацион
-- =========================================

alter table public.share_packs
  drop constraint if exists share_packs_kind_check;

alter table public.share_packs
  add constraint share_packs_kind_check
  check (kind in ('meals', 'workouts', 'meal'));
