-- "My day": a daily checklist each person builds for themselves. Two tables.
--   my_day_tasks : the tasks on the person's list. Either one of 12 menu templates (template_key; the app supplies the words)
--                  or a task the person typed (title, 1 to 60 characters). A time of day and the days of the week it repeats on.
--   my_day_done  : one row per task per day the person ticked it. Deleting the row un-ticks it.
-- Only the owner can read, add, change or remove anything. Same two-step rule as the other tables: a person with a verified
-- authenticator needs an aal2 session. Requires 0005 (has_verified_mfa). Fake data only until the Supabase region is settled.
-- The list is a reminder the person ticks themselves. Nothing here tracks doses or alerts anyone.

create table if not exists public.my_day_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  template_key text check (template_key in ('medicines','blood-pressure','meal','water','walk','call','bed','pillbox','mail','groceries','laundry','appointments')),
  title text check (title = btrim(title) and length(title) between 1 and 60),
  time_of_day text not null check (time_of_day in ('morning','midday','evening','bedtime')),
  -- Days of the week as a bit mask: Monday 1, Tuesday 2, Wednesday 4, Thursday 8, Friday 16, Saturday 32, Sunday 64. 127 is every day.
  days smallint not null default 127 check (days between 1 and 127),
  created_at timestamptz not null default now(),
  -- Exactly one of the two: a menu template (words come from the app) or a typed title.
  constraint my_day_tasks_one_name check ((template_key is null) <> (title is null)),
  -- Lets my_day_done point at a task AND its owner, so a tick can never be written for someone else's task.
  constraint my_day_tasks_id_user_uq unique (id, user_id)
);

create index if not exists my_day_tasks_user_idx on public.my_day_tasks (user_id, created_at);
-- A menu template can be added once per person.
create unique index if not exists my_day_tasks_template_uq on public.my_day_tasks (user_id, template_key) where template_key is not null;

-- At most 20 tasks per person, enforced here as well as in the app.
create or replace function public.my_day_tasks_limit() returns trigger
language plpgsql security invoker set search_path = public as $$
begin
  if (select count(*) from public.my_day_tasks where user_id = new.user_id) >= 20 then
    raise exception 'You can save up to 20 tasks.' using errcode = 'check_violation';
  end if;
  return new;
end $$;

drop trigger if exists my_day_tasks_limit_trg on public.my_day_tasks;
create trigger my_day_tasks_limit_trg before insert on public.my_day_tasks
  for each row execute function public.my_day_tasks_limit();

create table if not exists public.my_day_done (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  task_id uuid not null,
  -- The person's own local date when they ticked it.
  day date not null,
  done_at timestamptz not null default now(),
  -- Only the person themselves in v1. A later caregiver feature will widen this with its own consent step.
  done_by text not null default 'self' check (done_by = 'self'),
  constraint my_day_done_task_fk foreign key (task_id, user_id) references public.my_day_tasks (id, user_id) on delete cascade,
  constraint my_day_done_once unique (task_id, day)
);

create index if not exists my_day_done_user_day_idx on public.my_day_done (user_id, day);

-- A tick must be for a day close to today (time zones can put "today" a day either side of the server's date). Done in a trigger
-- because a CHECK that reads the current date would fail when old rows are restored.
create or replace function public.my_day_done_day() returns trigger
language plpgsql security invoker set search_path = public as $$
begin
  if new.day < current_date - 2 or new.day > current_date + 2 then
    raise exception 'That day is too far from today.' using errcode = 'check_violation';
  end if;
  return new;
end $$;

drop trigger if exists my_day_done_day_trg on public.my_day_done;
create trigger my_day_done_day_trg before insert on public.my_day_done
  for each row execute function public.my_day_done_day();

alter table public.my_day_tasks enable row level security;
alter table public.my_day_done enable row level security;
revoke all on public.my_day_tasks from public, anon;
revoke all on public.my_day_done from public, anon;
grant select, insert, delete on public.my_day_tasks to authenticated;
grant update (title, time_of_day, days) on public.my_day_tasks to authenticated;
grant select, insert, delete on public.my_day_done to authenticated;

drop policy if exists my_day_tasks_select_own on public.my_day_tasks;
drop policy if exists my_day_tasks_insert_own on public.my_day_tasks;
drop policy if exists my_day_tasks_update_own on public.my_day_tasks;
drop policy if exists my_day_tasks_delete_own on public.my_day_tasks;
drop policy if exists require_aal2_if_enrolled on public.my_day_tasks;
drop policy if exists my_day_done_select_own on public.my_day_done;
drop policy if exists my_day_done_insert_own on public.my_day_done;
drop policy if exists my_day_done_delete_own on public.my_day_done;
drop policy if exists require_aal2_if_enrolled on public.my_day_done;

create policy my_day_tasks_select_own on public.my_day_tasks for select to authenticated
  using (user_id = (select auth.uid()));
create policy my_day_tasks_insert_own on public.my_day_tasks for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy my_day_tasks_update_own on public.my_day_tasks for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy my_day_tasks_delete_own on public.my_day_tasks for delete to authenticated
  using (user_id = (select auth.uid()));

create policy my_day_done_select_own on public.my_day_done for select to authenticated
  using (user_id = (select auth.uid()));
create policy my_day_done_insert_own on public.my_day_done for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy my_day_done_delete_own on public.my_day_done for delete to authenticated
  using (user_id = (select auth.uid()));

create policy require_aal2_if_enrolled on public.my_day_tasks as restrictive for all to authenticated
  using ((auth.jwt() ->> 'aal') = 'aal2' or not public.has_verified_mfa())
  with check ((auth.jwt() ->> 'aal') = 'aal2' or not public.has_verified_mfa());
create policy require_aal2_if_enrolled on public.my_day_done as restrictive for all to authenticated
  using ((auth.jwt() ->> 'aal') = 'aal2' or not public.has_verified_mfa())
  with check ((auth.jwt() ->> 'aal') = 'aal2' or not public.has_verified_mfa());
