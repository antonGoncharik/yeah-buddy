-- Штрихкод личного продукта. В общий каталог неизвестная пачка не пишется.

alter table public.foods
  add column if not exists barcode text;

create unique index if not exists foods_user_barcode_uidx
  on public.foods (user_id, barcode)
  where barcode is not null;
