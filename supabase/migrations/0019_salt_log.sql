-- Salt log: sodium totals a person saves from the plate scan. One table, owner-only.
--   Each row is one saved plate: the day (the person's own calendar day), the sodium total in mg as the plate scan worked it out
--   from official food tables, how many foods had an official sodium value (foods_counted) and how many foods were on the plate (foods_total).
--   The app always shows the two food counts next to a total, because foods without an official number are left out and a total is never a full total.
--   No target, no limit and no good or bad label is stored or computed. Rows cannot be edited: delete one and save again.
--   Needs 0005 (has_verified_mfa). Safe to run twice. Fake data only until the region is settled.
-- Do not put this table's contents in logs: eating habits can reveal health information.

create table if not exists public.salt_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  logged_on date not null check (logged_on between date '2000-01-01' and date '2100-12-31'),
  sodium_mg integer not null check (sodium_mg between 0 and 100000),
  foods_counted smallint not null check (foods_counted between 1 and 12),
  foods_total smallint not null check (foods_total between 1 and 12 and foods_total >= foods_counted),
  created_at timestamptz not null default now()
);

create index if not exists salt_log_user_day_idx on public.salt_log (user_id, logged_on);

-- At most 500 saved plates per person, enforced here as well as in the app.
create or replace function public.salt_log_limit() returns trigger
language plpgsql security invoker set search_path = public as $$
begin
  if (select count(*) from public.salt_log where user_id = new.user_id) >= 500 then
    raise exception 'You can save up to 500 plates.' using errcode = 'check_violation';
  end if;
  return new;
end $$;

drop trigger if exists salt_log_limit_trg on public.salt_log;
create trigger salt_log_limit_trg before insert on public.salt_log
  for each row execute function public.salt_log_limit();

alter table public.salt_log enable row level security;
revoke all on public.salt_log from public, anon;
grant select, insert, delete on public.salt_log to authenticated;

drop policy if exists salt_log_select_own on public.salt_log;
drop policy if exists salt_log_insert_own on public.salt_log;
drop policy if exists salt_log_delete_own on public.salt_log;
drop policy if exists require_aal2_if_enrolled on public.salt_log;

create policy salt_log_select_own on public.salt_log for select to authenticated using (user_id = (select auth.uid()));
create policy salt_log_insert_own on public.salt_log for insert to authenticated with check (user_id = (select auth.uid()));
create policy salt_log_delete_own on public.salt_log for delete to authenticated using (user_id = (select auth.uid()));
create policy require_aal2_if_enrolled on public.salt_log as restrictive for all to authenticated
  using ((auth.jwt() ->> 'aal') = 'aal2' or not public.has_verified_mfa())
  with check ((auth.jwt() ->> 'aal') = 'aal2' or not public.has_verified_mfa());
