-- Allow any ISO 3166-1 alpha-2 country code. Health content still exists only for CA, US and GB (enforced in the app).
alter table public.profiles drop constraint if exists profiles_country_code_check;
alter table public.profiles add constraint profiles_country_code_check check (country_code ~ '^[A-Z]{2}$');
