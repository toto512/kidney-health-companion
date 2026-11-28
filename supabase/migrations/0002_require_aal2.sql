-- Server-side MFA enforcement: user-data tables are only reachable with an aal2 (TOTP-verified) session.
-- Restrictive policies are ANDed with the permissive per-user policies from 0001.
create policy require_aal2 on public.profiles as restrictive for all to authenticated
  using ((auth.jwt() ->> 'aal') = 'aal2') with check ((auth.jwt() ->> 'aal') = 'aal2');
create policy require_aal2 on public.bp_readings as restrictive for all to authenticated
  using ((auth.jwt() ->> 'aal') = 'aal2') with check ((auth.jwt() ->> 'aal') = 'aal2');
create policy require_aal2 on public.lab_results as restrictive for all to authenticated
  using ((auth.jwt() ->> 'aal') = 'aal2') with check ((auth.jwt() ->> 'aal') = 'aal2');
create policy require_aal2 on public.carer_grants as restrictive for all to authenticated
  using ((auth.jwt() ->> 'aal') = 'aal2') with check ((auth.jwt() ->> 'aal') = 'aal2');
