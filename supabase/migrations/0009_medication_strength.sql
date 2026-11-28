-- Optional strength the person types for a medicine, for example "150 mcg", "300 mg" or "5 ml", as it is on their label.
-- The app never suggests or calculates a strength. Own-row only, same as 0008. Requires 0008.
-- Adds an UPDATE path (strength only) because a strength can be edited after the medicine was added.

alter table public.user_medications add column if not exists strength text;

alter table public.user_medications drop constraint if exists user_medications_strength_ok;
alter table public.user_medications add constraint user_medications_strength_ok
  check (strength is null or (strength = btrim(strength) and length(strength) between 1 and 40 and strength ~ '^[A-Za-z0-9µμ .,/%+()-]+$'));

-- Only the strength column can be changed; the name and ids stay as they were added.
grant update (strength) on public.user_medications to authenticated;

drop policy if exists user_medications_update_own on public.user_medications;
create policy user_medications_update_own on public.user_medications for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- The restrictive require_aal2_if_enrolled policy from 0008 is "for all", so it already covers updates.
