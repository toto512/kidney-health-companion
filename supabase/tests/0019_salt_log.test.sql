\set ON_ERROR_STOP on
-- Run on a fresh scratch database after stub_supabase_auth.sql (see README).
\i ../migrations/0019_salt_log.sql
\i ../migrations/0019_salt_log.sql
delete from auth.mfa_factors where user_id='00000000-0000-0000-0000-000000000002';
set role authenticated;
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000002';
set request.jwt.claims='{"aal":"aal1"}';
insert into public.salt_log(user_id, logged_on, sodium_mg, foods_counted, foods_total) values ('00000000-0000-0000-0000-000000000002','2026-12-01',1200,3,4);
insert into public.salt_log(user_id, logged_on, sodium_mg, foods_counted, foods_total) values ('00000000-0000-0000-0000-000000000002','2026-12-01',0,1,1);
select 'own plates (expect 2)', count(*) from public.salt_log;
do $$ begin
  begin insert into public.salt_log(user_id, logged_on, sodium_mg, foods_counted, foods_total) values ('00000000-0000-0000-0000-000000000001','2026-12-01',100,1,1); raise exception 'FAIL: inserted for another user'; exception when insufficient_privilege then raise notice 'ok: other-user insert blocked'; end;
  begin insert into public.salt_log(user_id, logged_on, sodium_mg, foods_counted, foods_total) values ('00000000-0000-0000-0000-000000000002','2026-12-01',-1,1,1); raise exception 'FAIL: negative sodium'; exception when check_violation then raise notice 'ok: negative sodium rejected'; end;
  begin insert into public.salt_log(user_id, logged_on, sodium_mg, foods_counted, foods_total) values ('00000000-0000-0000-0000-000000000002','2026-12-01',100001,1,1); raise exception 'FAIL: huge sodium'; exception when check_violation then raise notice 'ok: over 100000 mg rejected'; end;
  begin insert into public.salt_log(user_id, logged_on, sodium_mg, foods_counted, foods_total) values ('00000000-0000-0000-0000-000000000002','2026-12-01',100,0,1); raise exception 'FAIL: zero foods counted'; exception when check_violation then raise notice 'ok: zero counted foods rejected'; end;
  begin insert into public.salt_log(user_id, logged_on, sodium_mg, foods_counted, foods_total) values ('00000000-0000-0000-0000-000000000002','2026-12-01',100,3,2); raise exception 'FAIL: counted above total'; exception when check_violation then raise notice 'ok: counted above total rejected'; end;
  begin insert into public.salt_log(user_id, logged_on, sodium_mg, foods_counted, foods_total) values ('00000000-0000-0000-0000-000000000002','2026-12-01',100,1,13); raise exception 'FAIL: 13 foods'; exception when check_violation then raise notice 'ok: more than 12 foods rejected'; end;
  begin insert into public.salt_log(user_id, logged_on, sodium_mg, foods_counted, foods_total) values ('00000000-0000-0000-0000-000000000002','1999-12-31',100,1,1); raise exception 'FAIL: date before 2000'; exception when check_violation then raise notice 'ok: date before 2000 rejected'; end;
  begin insert into public.salt_log(user_id, logged_on, sodium_mg, foods_counted, foods_total) values ('00000000-0000-0000-0000-000000000002','2101-01-01',100,1,1); raise exception 'FAIL: date after 2100'; exception when check_violation then raise notice 'ok: date after 2100 rejected'; end;
  begin update public.salt_log set sodium_mg = 1; raise exception 'FAIL: update allowed'; exception when insufficient_privilege then raise notice 'ok: rows cannot be edited'; end;
end $$;
-- the 500-plate limit: 2 exist, add 498 more, the 501st is refused
insert into public.salt_log(user_id, logged_on, sodium_mg, foods_counted, foods_total) select '00000000-0000-0000-0000-000000000002', '2026-12-02', 100, 1, 1 from generate_series(1, 498);
do $$ begin
  begin insert into public.salt_log(user_id, logged_on, sodium_mg, foods_counted, foods_total) values ('00000000-0000-0000-0000-000000000002','2026-12-03',100,1,1); raise exception 'FAIL: 501st plate'; exception when check_violation then
    if sqlerrm <> 'You can save up to 500 plates.' then raise exception 'FAIL: wrong message: %', sqlerrm; end if;
    raise notice 'ok: 501st plate refused with the limit message'; end;
end $$;
-- another person sees and deletes nothing; anon is blocked
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
select 'other user sees (expect 0)', count(*) from public.salt_log;
delete from public.salt_log;
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000002';
select 'untouched (expect 500)', count(*) from public.salt_log;
delete from public.salt_log where logged_on = '2026-12-02';
select 'own delete works (expect 2)', count(*) from public.salt_log;
reset role;
set role anon;
do $$ begin
  begin perform count(*) from public.salt_log; raise exception 'FAIL: anon read'; exception when insufficient_privilege then raise notice 'ok: anon blocked'; end;
end $$;
reset role;
-- two-step rule: enrolled person on aal1 is blocked, aal2 works
insert into auth.mfa_factors(user_id, status) values ('00000000-0000-0000-0000-000000000002','verified');
set role authenticated;
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000002';
do $$ begin
  begin insert into public.salt_log(user_id, logged_on, sodium_mg, foods_counted, foods_total) values ('00000000-0000-0000-0000-000000000002','2026-12-04',100,1,1); raise exception 'FAIL: aal1 write allowed'; exception when insufficient_privilege then raise notice 'ok: enrolled aal1 write blocked'; end;
end $$;
select 'enrolled aal1 reads (expect 0)', count(*) from public.salt_log;
set request.jwt.claims='{"aal":"aal2"}';
select 'enrolled aal2 reads (expect 2)', count(*) from public.salt_log;
insert into public.salt_log(user_id, logged_on, sodium_mg, foods_counted, foods_total) values ('00000000-0000-0000-0000-000000000002','2026-12-04',100,1,1);
select 'enrolled aal2 wrote (expect 3)', count(*) from public.salt_log;
reset role;
