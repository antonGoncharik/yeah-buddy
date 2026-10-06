alter table user_settings
  add column if not exists midday_reminded_on date;
