-- Two-step sign-in is optional. A user with no verified authenticator can use a password-only (aal1) session.
-- A user who has a verified authenticator still needs an aal2 session, so turning it on really protects the data.
-- Row-level security by user id (policies from 0001) is unchanged and still applies to everyone.

-- Reads only the caller's own factors. SECURITY DEFINER because the authenticated role cannot read the auth schema.
create or replace function public.has_verified_mfa()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from auth.mfa_factors f
    where f.user_id = (select auth.uid()) and f.status = 'verified'
  );
$$;
revoke all on function public.has_verified_mfa() from public, anon;
grant execute on function public.has_verified_mfa() to authenticated;

drop policy if exists require_aal2 on public.profiles;
drop policy if exists require_aal2 on public.bp_readings;
drop policy if exists require_aal2 on public.lab_results;
drop policy if exists require_aal2 on public.carer_grants;

create policy require_aal2_if_enrolled on public.profiles as restrictive for all to authenticated
  using ((auth.jwt() ->> 'aal') = 'aal2' or not public.has_verified_mfa())
  with check ((auth.jwt() ->> 'aal') = 'aal2' or not public.has_verified_mfa());
create policy require_aal2_if_enrolled on public.bp_readings as restrictive for all to authenticated
  using ((auth.jwt() ->> 'aal') = 'aal2' or not public.has_verified_mfa())
  with check ((auth.jwt() ->> 'aal') = 'aal2' or not public.has_verified_mfa());
create policy require_aal2_if_enrolled on public.lab_results as restrictive for all to authenticated
  using ((auth.jwt() ->> 'aal') = 'aal2' or not public.has_verified_mfa())
  with check ((auth.jwt() ->> 'aal') = 'aal2' or not public.has_verified_mfa());
create policy require_aal2_if_enrolled on public.carer_grants as restrictive for all to authenticated
  using ((auth.jwt() ->> 'aal') = 'aal2' or not public.has_verified_mfa())
  with check ((auth.jwt() ->> 'aal') = 'aal2' or not public.has_verified_mfa());
