\set ON_ERROR_STOP on
-- Run on a fresh scratch database after stub_supabase_auth.sql (see README).
\i ../migrations/0008_user_medications.sql
\i ../migrations/0008_user_medications.sql
-- user 2 has no verified MFA (aal1 is fine), user 1 is enrolled.
delete from auth.mfa_factors where user_id='00000000-0000-0000-0000-000000000002';
set role authenticated;
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000002';
set request.jwt.claims='{"aal":"aal1"}';
insert into public.user_medications(user_id, med_id) values ('00000000-0000-0000-0000-000000000002','atorvastatin');
insert into public.user_medications(user_id, custom_name) values ('00000000-0000-0000-0000-000000000002','My vitamin');
select 'own rows (expect 2)', count(*) from public.user_medications;
do $$ begin
  begin insert into public.user_medications(user_id, med_id) values ('00000000-0000-0000-0000-000000000001','ramipril'); raise exception 'FAIL: inserted for another user'; exception when insufficient_privilege then raise notice 'ok: other-user insert blocked'; end;
  begin insert into public.user_medications(user_id, med_id) values ('00000000-0000-0000-0000-000000000002','Bad Id!'); raise exception 'FAIL: bad id'; exception when check_violation then raise notice 'ok: bad id rejected'; end;
  begin insert into public.user_medications(user_id, med_id, custom_name) values ('00000000-0000-0000-0000-000000000002','ramipril','Both'); raise exception 'FAIL: both kinds'; exception when check_violation then raise notice 'ok: both med_id and custom_name rejected'; end;
  begin insert into public.user_medications(user_id) values ('00000000-0000-0000-0000-000000000002'); raise exception 'FAIL: neither kind'; exception when check_violation then raise notice 'ok: neither rejected'; end;
  begin insert into public.user_medications(user_id, custom_name) values ('00000000-0000-0000-0000-000000000002',' padded '); raise exception 'FAIL: padded name'; exception when check_violation then raise notice 'ok: untrimmed name rejected'; end;
  begin insert into public.user_medications(user_id, custom_name) values ('00000000-0000-0000-0000-000000000002',repeat('a',101)); raise exception 'FAIL: long name'; exception when check_violation then raise notice 'ok: 101 characters rejected'; end;
  begin insert into public.user_medications(user_id, med_id) values ('00000000-0000-0000-0000-000000000002','atorvastatin'); raise exception 'FAIL: duplicate'; exception when unique_violation then raise notice 'ok: duplicate list item rejected'; end;
  begin insert into public.user_medications(user_id, custom_name) values ('00000000-0000-0000-0000-000000000002','MY VITAMIN'); raise exception 'FAIL: duplicate custom'; exception when unique_violation then raise notice 'ok: duplicate custom name rejected'; end;
end $$;
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
select 'other user sees (expect 0)', count(*) from public.user_medications;
do $$ begin
  begin insert into public.user_medications(user_id, med_id) values ('00000000-0000-0000-0000-000000000001','ramipril'); raise exception 'FAIL: aal1 write allowed'; exception when insufficient_privilege then raise notice 'ok: enrolled aal1 write blocked'; end;
end $$;
set request.jwt.claims='{"aal":"aal2"}';
insert into public.user_medications(user_id, med_id) values ('00000000-0000-0000-0000-000000000001','ramipril');
delete from public.user_medications where med_id='ramipril';
select 'after delete (expect 0)', count(*) from public.user_medications;
reset role;
do $$ begin set role anon; begin perform 1 from public.user_medications; raise exception 'FAIL: anon read'; exception when insufficient_privilege then raise notice 'ok: anon blocked'; end; end $$;
