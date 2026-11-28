-- Conditions a person chooses to track (optional). One row per person and condition.
-- condition_id is a stable slug from the app's condition list (app/src/content/conditionList.ts).
-- Only the owner can read, add or remove their rows. Same two-step rule as the other tables: a person with a verified
-- authenticator needs an aal2 session. Fake data only until the Supabase region is settled.

create table if not exists public.user_conditions (
  user_id uuid not null references auth.users (id) on delete cascade,
  condition_id text not null check (condition_id ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(condition_id) <= 64),
  created_at timestamptz not null default now(),
  primary key (user_id, condition_id)
);

alter table public.user_conditions enable row level security;
revoke all on public.user_conditions from public, anon;
grant select, insert, delete on public.user_conditions to authenticated;

drop policy if exists user_conditions_select_own on public.user_conditions;
drop policy if exists user_conditions_insert_own on public.user_conditions;
drop policy if exists user_conditions_delete_own on public.user_conditions;
drop policy if exists require_aal2_if_enrolled on public.user_conditions;

create policy user_conditions_select_own on public.user_conditions for select to authenticated
  using (user_id = (select auth.uid()));
create policy user_conditions_insert_own on public.user_conditions for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy user_conditions_delete_own on public.user_conditions for delete to authenticated
  using (user_id = (select auth.uid()));

-- Requires 0005 (has_verified_mfa).
create policy require_aal2_if_enrolled on public.user_conditions as restrictive for all to authenticated
  using ((auth.jwt() ->> 'aal') = 'aal2' or not public.has_verified_mfa())
  with check ((auth.jwt() ->> 'aal') = 'aal2' or not public.has_verified_mfa());
