\set ON_ERROR_STOP on
-- Run after stub_supabase_auth.sql, 0013, 0014 and their tests (see README).
\i ../migrations/0015_my_day_limit_30.sql
\i ../migrations/0015_my_day_limit_30.sql
delete from public.my_day_done; delete from public.my_day_tasks;
delete from auth.mfa_factors where user_id='00000000-0000-0000-0000-000000000002';
set role authenticated;
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000002';
set request.jwt.claims='{"aal":"aal1"}';
insert into public.my_day_tasks(user_id, title, time_of_day) select '00000000-0000-0000-0000-000000000002', 'Task ' || g, 'midday' from generate_series(1, 30) g;
select 'tasks saved (expect 30)', count(*) from public.my_day_tasks;
do $$ begin
  begin insert into public.my_day_tasks(user_id, title, time_of_day) values ('00000000-0000-0000-0000-000000000002','Thirty-first','midday'); raise exception 'FAIL: 31st task allowed';
  exception when check_violation then
    if sqlerrm <> 'You can save up to 30 tasks.' then raise exception 'FAIL: wrong message: %', sqlerrm; end if;
    raise notice 'ok: 31st task refused with the 30-task message'; end;
end $$;
-- another person still has their own 30
reset role;
select 'user 1 unaffected (expect 0)', count(*) from public.my_day_tasks where user_id='00000000-0000-0000-0000-000000000001';
