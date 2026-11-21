-- Medicines a person says they take (optional). Names only: no doses, schedules or advice are stored.
-- A row is either a medicine from the app's list (med_id, a slug from app/src/content/medList.ts) or the person's own
-- free-text name (custom_name), never both. `note` is reserved and unused by the app for now.
-- Only the owner can read, add or remove their rows. Same two-step rule as the other tables: a person with a verified
-- authenticator needs an aal2 session. Fake data only until the Supabase region is settled. Requires 0005 (has_verified_mfa).

create table if not exists public.user_medications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  med_id text check (med_id ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(med_id) <= 64),
  custom_name text check (custom_name = btrim(custom_name) and length(custom_name) between 1 and 100),
  note text check (length(note) <= 200),
  created_at timestamptz not null default now(),
  constraint user_medications_one_kind check (num_nonnulls(med_id, custom_name) = 1)
);

create unique index if not exists user_medications_list_uniq on public.user_medications (user_id, med_id) where med_id is not null;
create unique index if not exists user_medications_custom_uniq on public.user_medications (user_id, lower(custom_name)) where custom_name is not null;

alter table public.user_medications enable row level security;
revoke all on public.user_medications from public, anon;
grant select, insert, delete on public.user_medications to authenticated;

drop policy if exists user_medications_select_own on public.user_medications;
drop policy if exists user_medications_insert_own on public.user_medications;
drop policy if exists user_medications_delete_own on public.user_medications;
drop policy if exists require_aal2_if_enrolled on public.user_medications;

create policy user_medications_select_own on public.user_medications for select to authenticated
  using (user_id = (select auth.uid()));
create policy user_medications_insert_own on public.user_medications for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy user_medications_delete_own on public.user_medications for delete to authenticated
  using (user_id = (select auth.uid()));

create policy require_aal2_if_enrolled on public.user_medications as restrictive for all to authenticated
  using ((auth.jwt() ->> 'aal') = 'aal2' or not public.has_verified_mfa())
  with check ((auth.jwt() ->> 'aal') = 'aal2' or not public.has_verified_mfa());
