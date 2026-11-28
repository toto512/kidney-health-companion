-- Body weight log: one table, owner-only, same pattern as bp_readings.
--   weight_kg is the canonical value (2 decimals, so a weight typed in pounds converts back to the same pounds).
--   entered_unit remembers which unit the person typed ('kg' or 'lb'); the app can show either.
--   The limits are input checks only, wider than what the app lets a person save. They say nothing about a healthy weight.
--   Needs 0005 (has_verified_mfa). Safe to run twice. Fake data only until the region is settled.

create table if not exists public.weight_readings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  weight_kg numeric(6,2) not null check (weight_kg between 10 and 500),
  entered_unit text not null default 'kg' check (entered_unit in ('kg','lb')),
  taken_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists weight_readings_user_taken_idx on public.weight_readings (user_id, taken_at desc);

-- At most 2000 readings per person (about 5 years of daily weights), enforced here as well as in the app.
create or replace function public.weight_readings_limit() returns trigger
language plpgsql security invoker set search_path = public as $$
begin
  if (select count(*) from public.weight_readings where user_id = new.user_id) >= 2000 then
    raise exception 'You can save up to 2000 weights.' using errcode = 'check_violation';
  end if;
  return new;
end $$;

drop trigger if exists weight_readings_limit_trg on public.weight_readings;
create trigger weight_readings_limit_trg before insert on public.weight_readings
  for each row execute function public.weight_readings_limit();

alter table public.weight_readings enable row level security;
revoke all on public.weight_readings from public, anon;
grant select, insert, delete on public.weight_readings to authenticated;
-- No update: a wrong weight is deleted and added again, so the list never silently changes.

drop policy if exists weight_select_own on public.weight_readings;
drop policy if exists weight_insert_own on public.weight_readings;
drop policy if exists weight_delete_own on public.weight_readings;
drop policy if exists require_aal2_if_enrolled on public.weight_readings;

create policy weight_select_own on public.weight_readings for select to authenticated using (user_id = (select auth.uid()));
create policy weight_insert_own on public.weight_readings for insert to authenticated with check (user_id = (select auth.uid()));
create policy weight_delete_own on public.weight_readings for delete to authenticated using (user_id = (select auth.uid()));
create policy require_aal2_if_enrolled on public.weight_readings as restrictive for all to authenticated
  using ((auth.jwt() ->> 'aal') = 'aal2' or not public.has_verified_mfa())
  with check ((auth.jwt() ->> 'aal') = 'aal2' or not public.has_verified_mfa());
