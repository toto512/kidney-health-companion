-- "My people": up to 5 personal contacts per person (doctor, nurse, family, friend). Name, who they are, and a phone number.
-- The phone is stored in international form (E.164): a plus sign, then 7 to 15 digits, for example +16135550100.
-- Only the owner can read, add, change or remove their rows. Same two-step rule as the other tables: a person with a verified
-- authenticator needs an aal2 session. Fake data only until the Supabase region is settled. Requires 0005 (has_verified_mfa).

create table if not exists public.emergency_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (name = btrim(name) and length(name) between 1 and 60),
  relationship text not null check (relationship in ('doctor','nurse','parent','partner','child','sibling','friend','neighbour','other')),
  phone text not null check (phone ~ '^\+[1-9][0-9]{6,14}$'),
  created_at timestamptz not null default now()
);

create index if not exists emergency_contacts_user_idx on public.emergency_contacts (user_id, created_at);

-- At most 5 contacts per person, enforced here as well as in the app.
create or replace function public.emergency_contacts_limit() returns trigger
language plpgsql security invoker set search_path = public as $$
begin
  if (select count(*) from public.emergency_contacts where user_id = new.user_id) >= 5 then
    raise exception 'You can save up to 5 contacts.' using errcode = 'check_violation';
  end if;
  return new;
end $$;

drop trigger if exists emergency_contacts_limit_trg on public.emergency_contacts;
create trigger emergency_contacts_limit_trg before insert on public.emergency_contacts
  for each row execute function public.emergency_contacts_limit();

alter table public.emergency_contacts enable row level security;
revoke all on public.emergency_contacts from public, anon;
grant select, insert, delete on public.emergency_contacts to authenticated;
grant update (name, relationship, phone) on public.emergency_contacts to authenticated;

drop policy if exists emergency_contacts_select_own on public.emergency_contacts;
drop policy if exists emergency_contacts_insert_own on public.emergency_contacts;
drop policy if exists emergency_contacts_update_own on public.emergency_contacts;
drop policy if exists emergency_contacts_delete_own on public.emergency_contacts;
drop policy if exists require_aal2_if_enrolled on public.emergency_contacts;

create policy emergency_contacts_select_own on public.emergency_contacts for select to authenticated
  using (user_id = (select auth.uid()));
create policy emergency_contacts_insert_own on public.emergency_contacts for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy emergency_contacts_update_own on public.emergency_contacts for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy emergency_contacts_delete_own on public.emergency_contacts for delete to authenticated
  using (user_id = (select auth.uid()));

create policy require_aal2_if_enrolled on public.emergency_contacts as restrictive for all to authenticated
  using ((auth.jwt() ->> 'aal') = 'aal2' or not public.has_verified_mfa())
  with check ((auth.jwt() ->> 'aal') = 'aal2' or not public.has_verified_mfa());
