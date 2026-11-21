-- Calendar: appointments a person types in themselves. One table, owner-only.
--   title (1 to 60), optional note (up to 200), the date, a 24-hour time, an optional repeat, and a reminder lead time.
--   Reminders are shown inside the app only; this table does not send anything. My day tasks are NOT stored here
--   (the calendar works them out from each task's days). Needs 0005 (has_verified_mfa). Safe to run twice. Fake data only until the region is settled.
-- Titles and notes can reveal health information: keep them out of logs.

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (title = btrim(title) and length(title) between 1 and 60),
  note text check (note is null or (note = btrim(note) and length(note) between 1 and 200)),
  starts_on date not null check (starts_on between date '2000-01-01' and date '2100-12-31'),
  starts_at time not null check (date_part('second', starts_at) = 0),
  repeat text not null default 'none' check (repeat in ('none','weekly','monthly')),
  -- Minutes before the start that the app shows a reminder. 0 means no reminder.
  remind_minutes integer not null default 0 check (remind_minutes in (0, 60, 1440)),
  created_at timestamptz not null default now()
);

create index if not exists appointments_user_date_idx on public.appointments (user_id, starts_on);

-- At most 100 appointments per person, enforced here as well as in the app.
create or replace function public.appointments_limit() returns trigger
language plpgsql security invoker set search_path = public as $$
begin
  if (select count(*) from public.appointments where user_id = new.user_id) >= 100 then
    raise exception 'You can save up to 100 appointments.' using errcode = 'check_violation';
  end if;
  return new;
end $$;

drop trigger if exists appointments_limit_trg on public.appointments;
create trigger appointments_limit_trg before insert on public.appointments
  for each row execute function public.appointments_limit();

alter table public.appointments enable row level security;
revoke all on public.appointments from public, anon;
grant select, insert, delete on public.appointments to authenticated;
grant update (title, note, starts_on, starts_at, repeat, remind_minutes) on public.appointments to authenticated;

drop policy if exists appointments_select_own on public.appointments;
drop policy if exists appointments_insert_own on public.appointments;
drop policy if exists appointments_update_own on public.appointments;
drop policy if exists appointments_delete_own on public.appointments;
drop policy if exists require_aal2_if_enrolled on public.appointments;

create policy appointments_select_own on public.appointments for select to authenticated using (user_id = (select auth.uid()));
create policy appointments_insert_own on public.appointments for insert to authenticated with check (user_id = (select auth.uid()));
create policy appointments_update_own on public.appointments for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy appointments_delete_own on public.appointments for delete to authenticated using (user_id = (select auth.uid()));
create policy require_aal2_if_enrolled on public.appointments as restrictive for all to authenticated
  using ((auth.jwt() ->> 'aal') = 'aal2' or not public.has_verified_mfa())
  with check ((auth.jwt() ->> 'aal') = 'aal2' or not public.has_verified_mfa());
