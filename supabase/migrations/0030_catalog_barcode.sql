-- Штрихкод: свой ряд по EAN, кэш Open Food Facts.

alter table public.catalog_foods
  add column if not exists barcode text;

create unique index if not exists catalog_foods_barcode_uidx
  on public.catalog_foods (barcode)
  where barcode is not null;
