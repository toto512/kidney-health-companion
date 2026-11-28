\set ON_ERROR_STOP on
-- Run after: psql -f stub_supabase_auth.sql (see README). Expects a fresh scratch database.
\i ../migrations/0007_user_conditions.sql
\i ../migrations/0007_user_conditions.sql
-- user 1 has verified MFA (stub), user 2 too. Remove MFA for user 2 to test aal1 access.
delete from auth.mfa_factors where user_id='00000000-0000-0000-0000-000000000002';
set role authenticated;
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000002';
set request.jwt.claims='{"aal":"aal1"}';
insert into public.user_conditions(user_id,condition_id) values ('00000000-0000-0000-0000-000000000002','hypertension');
select 'own rows (expect 1)', count(*) from public.user_conditions;
do $$ begin
  begin insert into public.user_conditions(user_id,condition_id) values ('00000000-0000-0000-0000-000000000001','ckd'); raise exception 'FAIL: inserted for another user'; exception when insufficient_privilege or check_violation then raise notice 'ok: other-user insert blocked'; end;
  begin insert into public.user_conditions(user_id,condition_id) values ('00000000-0000-0000-0000-000000000002','Bad Id!'); raise exception 'FAIL: bad id accepted'; exception when check_violation then raise notice 'ok: bad id rejected'; end;
end $$;
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
select 'other user sees (expect 0)', count(*) from public.user_conditions;
-- user 1 enrolled, aal1: blocked; aal2: allowed
do $$ begin
  begin insert into public.user_conditions(user_id,condition_id) values ('00000000-0000-0000-0000-000000000001','ckd'); raise exception 'FAIL: aal1 write allowed'; exception when insufficient_privilege then raise notice 'ok: enrolled aal1 write blocked'; end;
end $$;
set request.jwt.claims='{"aal":"aal2"}';
insert into public.user_conditions(user_id,condition_id) values ('00000000-0000-0000-0000-000000000001','ckd');
delete from public.user_conditions where condition_id='ckd';
select 'after delete (expect 0)', count(*) from public.user_conditions;
reset role;
do $$ begin set role anon; begin perform 1 from public.user_conditions; raise exception 'FAIL: anon read'; exception when insufficient_privilege then raise notice 'ok: anon blocked'; end; end $$;
