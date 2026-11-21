-- Phase 2 core schema. Every table has RLS on. UNTESTED against a live database: run supabase/tests before use.
-- Fake data only. Content tables (conditions, medications, ...) arrive with verified sources in a later migration.

create table public.sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text not null,
  quote text,
  checked_on date not null
);

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text,
  dob date,
  height_cm numeric,
  weight_kg numeric,
  country_code text check (country_code in ('CA','US','GB')),
  tts_rate numeric not null default 0.8,
  tts_volume numeric not null default 1.0,
  created_at timestamptz not null default now()
);

create table public.carer_grants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  carer_id uuid not null references auth.users(id) on delete cascade,
  scopes text[] not null,
  expires_at timestamptz not null,
  revoked_at timestamptz
);

create table public.bp_readings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  systolic int not null check (systolic between 40 and 300),
  diastolic int not null check (diastolic between 20 and 200),
  pulse int check (pulse between 20 and 250),
  taken_at timestamptz not null default now()
);

create table public.lab_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  test_name text not null,
  value numeric not null,
  unit text not null,
  taken_on date not null,
  file_path text,
  -- Never save an unconfirmed OCR reading: the row cannot exist without a confirmation time.
  confirmed_at timestamptz not null
);

create table public.audit_log (
  id bigint generated always as identity primary key,
  actor uuid not null,
  action text not null,
  target_user uuid,
  at timestamptz not null default now()
);

alter table public.sources enable row level security;
alter table public.profiles enable row level security;
alter table public.carer_grants enable row level security;
alter table public.bp_readings enable row level security;
alter table public.lab_results enable row level security;
alter table public.audit_log enable row level security;

create policy sources_read on public.sources for select to authenticated using (true);
create policy profiles_own on public.profiles for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy bp_own on public.bp_readings for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy labs_own on public.lab_results for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy grants_owner on public.carer_grants for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy grants_carer_read on public.carer_grants for select to authenticated using (carer_id = auth.uid());
-- audit_log: no policies for authenticated users, so only the service role (backend/admin tooling) can read or write it.
