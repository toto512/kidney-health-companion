\set ON_ERROR_STOP on
-- Run on a fresh scratch database after stub_supabase_auth.sql (see README).
\i ../migrations/0018_body_weight.sql
\i ../migrations/0018_body_weight.sql
delete from auth.mfa_factors where user_id='00000000-0000-0000-0000-000000000002';
set role authenticated;
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000002';
set request.jwt.claims='{"aal":"aal1"}';
insert into public.weight_readings(user_id, weight_kg, entered_unit) values ('00000000-0000-0000-0000-000000000002', 69.85, 'lb');
insert into public.weight_readings(user_id, weight_kg) values ('00000000-0000-0000-0000-000000000002', 70.1);
select 'own weights (expect 2)', count(*) from public.weight_readings;
select 'default unit (expect kg)', entered_unit from public.weight_readings where weight_kg = 70.1;
select 'two decimals kept (expect 69.85)', weight_kg from public.weight_readings where entered_unit = 'lb';
do $$ begin
  begin insert into public.weight_readings(user_id, weight_kg) values ('00000000-0000-0000-0000-000000000001', 70); raise exception 'FAIL: inserted for another user'; exception when insufficient_privilege then raise notice 'ok: other-user insert blocked'; end;
  begin insert into public.weight_readings(user_id, weight_kg) values ('00000000-0000-0000-0000-000000000002', 9.9); raise exception 'FAIL: below 10 kg'; exception when check_violation then raise notice 'ok: below 10 kg rejected'; end;
  begin insert into public.weight_readings(user_id, weight_kg) values ('00000000-0000-0000-0000-000000000002', 500.1); raise exception 'FAIL: above 500 kg'; exception when check_violation or numeric_value_out_of_range then raise notice 'ok: above 500 kg rejected'; end;
  begin insert into public.weight_readings(user_id, weight_kg, entered_unit) values ('00000000-0000-0000-0000-000000000002', 70, 'st'); raise exception 'FAIL: unknown unit'; exception when check_violation then raise notice 'ok: unknown unit rejected'; end;
  begin insert into public.weight_readings(user_id, weight_kg) values ('00000000-0000-0000-0000-000000000002', null); raise exception 'FAIL: null weight'; exception when not_null_violation then raise notice 'ok: null weight rejected'; end;
  begin update public.weight_readings set weight_kg = 80; raise exception 'FAIL: update allowed'; exception when insufficient_privilege then raise notice 'ok: update blocked (delete and add again)'; end;
end $$;
-- the 2000-weight limit: 2 exist, add 1998 more, the 2001st is refused
insert into public.weight_readings(user_id, weight_kg) select '00000000-0000-0000-0000-000000000002', 70 from generate_series(1, 1998);
do $$ begin
  begin insert into public.weight_readings(user_id, weight_kg) values ('00000000-0000-0000-0000-000000000002', 70); raise exception 'FAIL: 2001st weight'; exception when check_violation then
    if sqlerrm <> 'You can save up to 2000 weights.' then raise exception 'FAIL: wrong message: %', sqlerrm; end if;
    raise notice 'ok: 2001st weight refused with the limit message'; end;
end $$;
-- delete own works
delete from public.weight_readings where entered_unit = 'lb';
select 'after delete (expect 1999)', count(*) from public.weight_readings;
-- another person sees and changes nothing; anon is blocked
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
select 'other user sees (expect 0)', count(*) from public.weight_readings;
delete from public.weight_readings;
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000002';
select 'untouched (expect 1999)', count(*) from public.weight_readings;
reset role;
set role anon;
do $$ begin
  begin perform count(*) from public.weight_readings; raise exception 'FAIL: anon read'; exception when insufficient_privilege then raise notice 'ok: anon blocked'; end;
end $$;
-- two-step rule: enrolled person on aal1 is blocked, aal2 works
reset role;
insert into auth.mfa_factors(user_id, status) values ('00000000-0000-0000-0000-000000000002','verified');
set role authenticated;
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000002';
set request.jwt.claims='{"aal":"aal1"}';
do $$ begin
  begin insert into public.weight_readings(user_id, weight_kg) values ('00000000-0000-0000-0000-000000000002', 70); raise exception 'FAIL: aal1 write allowed'; exception when insufficient_privilege then raise notice 'ok: enrolled aal1 write blocked'; end;
end $$;
select 'enrolled aal1 reads (expect 0)', count(*) from public.weight_readings;
set request.jwt.claims='{"aal":"aal2"}';
select 'enrolled aal2 reads (expect 1999)', count(*) from public.weight_readings;
delete from public.weight_readings;
select 'after delete (expect 0)', count(*) from public.weight_readings;
