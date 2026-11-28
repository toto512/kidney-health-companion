\set ON_ERROR_STOP on
-- Run on a fresh scratch database after stub_supabase_auth.sql (see README).
\i ../migrations/0013_my_day.sql
\i ../migrations/0013_my_day.sql
delete from auth.mfa_factors where user_id='00000000-0000-0000-0000-000000000002';
set role authenticated;
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000002';
set request.jwt.claims='{"aal":"aal1"}';
-- a menu task and a typed task
insert into public.my_day_tasks(user_id, template_key, time_of_day, days) values ('00000000-0000-0000-0000-000000000002','medicines','morning',127);
insert into public.my_day_tasks(user_id, title, time_of_day, days) values ('00000000-0000-0000-0000-000000000002','Water the plants','midday',5);
select 'own tasks (expect 2)', count(*) from public.my_day_tasks;
do $$ begin
  begin insert into public.my_day_tasks(user_id, template_key, time_of_day) values ('00000000-0000-0000-0000-000000000001','walk','midday'); raise exception 'FAIL: inserted for another user'; exception when insufficient_privilege then raise notice 'ok: other-user insert blocked'; end;
  begin insert into public.my_day_tasks(user_id, template_key, time_of_day) values ('00000000-0000-0000-0000-000000000002','medicines','evening'); raise exception 'FAIL: same template twice'; exception when unique_violation then raise notice 'ok: template can be added once'; end;
  begin insert into public.my_day_tasks(user_id, template_key, time_of_day) values ('00000000-0000-0000-0000-000000000002','flying','midday'); raise exception 'FAIL: unknown template'; exception when check_violation then raise notice 'ok: unknown template rejected'; end;
  begin insert into public.my_day_tasks(user_id, template_key, title, time_of_day) values ('00000000-0000-0000-0000-000000000002','walk','Both','midday'); raise exception 'FAIL: template and title together'; exception when check_violation then raise notice 'ok: template and title together rejected'; end;
  begin insert into public.my_day_tasks(user_id, time_of_day) values ('00000000-0000-0000-0000-000000000002','midday'); raise exception 'FAIL: no name'; exception when check_violation then raise notice 'ok: task with no name rejected'; end;
  begin insert into public.my_day_tasks(user_id, title, time_of_day) values ('00000000-0000-0000-0000-000000000002',' padded ','midday'); raise exception 'FAIL: padded title'; exception when check_violation then raise notice 'ok: untrimmed title rejected'; end;
  begin insert into public.my_day_tasks(user_id, title, time_of_day) values ('00000000-0000-0000-0000-000000000002',repeat('a',61),'midday'); raise exception 'FAIL: long title'; exception when check_violation then raise notice 'ok: 61 characters rejected'; end;
  begin insert into public.my_day_tasks(user_id, title, time_of_day) values ('00000000-0000-0000-0000-000000000002','Night shift','afternoon'); raise exception 'FAIL: bad time of day'; exception when check_violation then raise notice 'ok: unknown time of day rejected'; end;
  begin insert into public.my_day_tasks(user_id, title, time_of_day, days) values ('00000000-0000-0000-0000-000000000002','No days','midday',0); raise exception 'FAIL: no days'; exception when check_violation then raise notice 'ok: zero days rejected'; end;
  begin insert into public.my_day_tasks(user_id, title, time_of_day, days) values ('00000000-0000-0000-0000-000000000002','Too many days','midday',128); raise exception 'FAIL: day 8'; exception when check_violation then raise notice 'ok: days above 127 rejected'; end;
end $$;
-- ticks
insert into public.my_day_done(user_id, task_id, day) select user_id, id, current_date from public.my_day_tasks where template_key='medicines';
select 'ticks today (expect 1)', count(*) from public.my_day_done;
do $$ begin
  begin insert into public.my_day_done(user_id, task_id, day) select user_id, id, current_date from public.my_day_tasks where template_key='medicines'; raise exception 'FAIL: ticked twice'; exception when unique_violation then raise notice 'ok: one tick per task per day'; end;
  begin insert into public.my_day_done(user_id, task_id, day) select user_id, id, current_date - 3 from public.my_day_tasks where template_key='medicines'; raise exception 'FAIL: old day'; exception when check_violation then raise notice 'ok: tick 3 days back rejected'; end;
  begin insert into public.my_day_done(user_id, task_id, day) select user_id, id, current_date + 3 from public.my_day_tasks where template_key='medicines'; raise exception 'FAIL: future day'; exception when check_violation then raise notice 'ok: tick 3 days ahead rejected'; end;
  begin insert into public.my_day_done(user_id, task_id, day, done_by) select user_id, id, current_date - 1, 'caregiver' from public.my_day_tasks where template_key='medicines'; raise exception 'FAIL: caregiver tick'; exception when check_violation then raise notice 'ok: only self can tick in v1'; end;
end $$;
insert into public.my_day_done(user_id, task_id, day) select user_id, id, current_date - 1 from public.my_day_tasks where template_key='medicines';
-- the 20-task limit: 2 exist, add 18 more, the 21st is refused
insert into public.my_day_tasks(user_id, title, time_of_day) select '00000000-0000-0000-0000-000000000002', 'Task ' || g, 'evening' from generate_series(1, 18) g;
do $$ begin
  begin insert into public.my_day_tasks(user_id, title, time_of_day) values ('00000000-0000-0000-0000-000000000002','Twenty-first','evening'); raise exception 'FAIL: 21st task'; exception when check_violation then raise notice 'ok: 21st task refused'; end;
end $$;
-- editing: title, time of day and days can change; the owner and the template cannot
update public.my_day_tasks set time_of_day='evening', days=65 where title='Water the plants';
do $$ begin
  begin update public.my_day_tasks set user_id='00000000-0000-0000-0000-000000000001' where title='Water the plants'; raise exception 'FAIL: owner changed'; exception when insufficient_privilege then raise notice 'ok: owner column cannot be updated'; end;
  begin update public.my_day_tasks set template_key='walk' where title='Water the plants'; raise exception 'FAIL: template changed'; exception when insufficient_privilege then raise notice 'ok: template column cannot be updated'; end;
  begin update public.my_day_tasks set title='Not allowed' where template_key='medicines'; raise exception 'FAIL: title on template task'; exception when check_violation then raise notice 'ok: template task cannot take a title'; end;
end $$;
-- another person sees and changes nothing
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
select 'other user sees tasks (expect 0)', count(*) from public.my_day_tasks;
select 'other user sees ticks (expect 0)', count(*) from public.my_day_done;
update public.my_day_tasks set title='Hacked';
delete from public.my_day_done;
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000002';
select 'tasks untouched (expect 0)', count(*) from public.my_day_tasks where title='Hacked';
select 'ticks untouched (expect 2)', count(*) from public.my_day_done;
-- a tick cannot point at another person's task
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
set request.jwt.claims='{"aal":"aal2"}';
do $$ declare t uuid; begin
  reset role;
  select id into t from public.my_day_tasks where title='Water the plants';
  set role authenticated;
  begin insert into public.my_day_done(user_id, task_id, day) values ('00000000-0000-0000-0000-000000000001', t, current_date); raise exception 'FAIL: tick on another person''s task'; exception when foreign_key_violation then raise notice 'ok: cannot tick another person''s task'; end;
end $$;
-- un-tick, remove, and cascade
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000002';
set request.jwt.claims='{"aal":"aal1"}';
delete from public.my_day_done where day = current_date;
select 'ticks after un-tick (expect 1)', count(*) from public.my_day_done;
delete from public.my_day_tasks where template_key='medicines';
select 'ticks after removing the task (expect 0)', count(*) from public.my_day_done;
-- two-step rule: enrolled person on aal1 is blocked, aal2 works
reset role;
insert into auth.mfa_factors(user_id, status) values ('00000000-0000-0000-0000-000000000002','verified');
set role authenticated;
do $$ begin
  begin insert into public.my_day_tasks(user_id, title, time_of_day) values ('00000000-0000-0000-0000-000000000002','Enrolled','morning'); raise exception 'FAIL: aal1 write allowed'; exception when insufficient_privilege then raise notice 'ok: enrolled aal1 write blocked'; end;
end $$;
set request.jwt.claims='{"aal":"aal2"}';
delete from public.my_day_tasks;
select 'after delete (expect 0)', count(*) from public.my_day_tasks;
reset role;
do $$ begin set role anon; begin perform 1 from public.my_day_tasks; raise exception 'FAIL: anon read'; exception when insufficient_privilege then raise notice 'ok: anon blocked'; end; end $$;
reset role;
do $$ begin set role anon; begin perform 1 from public.my_day_done; raise exception 'FAIL: anon read ticks'; exception when insufficient_privilege then raise notice 'ok: anon blocked from ticks'; end; end $$;
