-- "My day": a person can save up to 30 tasks (was 20). The 20 menu tasks alone fill the old limit, so there was no room for tasks of their own.
-- Replaces the limit function from 0013; the trigger already points at it. Requires 0013. Safe to run more than once.

create or replace function public.my_day_tasks_limit() returns trigger
language plpgsql security invoker set search_path = public as $$
begin
  if (select count(*) from public.my_day_tasks where user_id = new.user_id) >= 30 then
    raise exception 'You can save up to 30 tasks.' using errcode = 'check_violation';
  end if;
  return new;
end $$;
