\set ON_ERROR_STOP on
-- Run on a fresh scratch database after stub_supabase_auth.sql and 0008 (see README).
\i ../migrations/0008_user_medications.sql
\i ../migrations/0009_medication_strength.sql
\i ../migrations/0009_medication_strength.sql
delete from auth.mfa_factors where user_id='00000000-0000-0000-0000-000000000002';
set role authenticated;
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000002';
set request.jwt.claims='{"aal":"aal1"}';
insert into public.user_medications(user_id, med_id, strength) values ('00000000-0000-0000-0000-000000000002','levothyroxine','150 mcg');
insert into public.user_medications(user_id, custom_name, strength) values ('00000000-0000-0000-0000-000000000002','My syrup','5 ml');
update public.user_medications set strength='300 mg' where med_id='levothyroxine';
select 'own strength (expect 300 mg)', strength from public.user_medications where med_id='levothyroxine';
update public.user_medications set strength=null where med_id='levothyroxine';
do $$ begin
  begin insert into public.user_medications(user_id, med_id, strength) values ('00000000-0000-0000-0000-000000000002','ramipril','<script>'); raise exception 'FAIL: bad chars'; exception when check_violation then raise notice 'ok: bad characters rejected'; end;
  begin update public.user_medications set strength=' 5 mg' where med_id='levothyroxine'; raise exception 'FAIL: untrimmed'; exception when check_violation then raise notice 'ok: untrimmed rejected'; end;
  begin update public.user_medications set strength=repeat('1',41) where med_id='levothyroxine'; raise exception 'FAIL: long'; exception when check_violation then raise notice 'ok: 41 characters rejected'; end;
  begin update public.user_medications set strength='' where med_id='levothyroxine'; raise exception 'FAIL: empty'; exception when check_violation then raise notice 'ok: empty string rejected'; end;
  begin update public.user_medications set med_id='ramipril' where med_id='levothyroxine'; raise exception 'FAIL: changed med_id'; exception when insufficient_privilege then raise notice 'ok: only strength is updatable'; end;
end $$;
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
update public.user_medications set strength='999 mg';
select 'other user changed rows (expect 0 strengths)', count(*) from public.user_medications where strength='999 mg';
do $$ begin
  begin update public.user_medications set strength='1 mg'; end;
end $$;
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000002';
select 'strength of other user untouched (expect 5 ml)', strength from public.user_medications where custom_name='My syrup';
-- enrolled user at aal1 cannot update
insert into public.user_medications(user_id, med_id) select '00000000-0000-0000-0000-000000000002','ramipril';
reset role;
insert into auth.mfa_factors(user_id,status) values ('00000000-0000-0000-0000-000000000002','verified');
set role authenticated;
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000002';
update public.user_medications set strength='1 mg' where med_id='ramipril';
select 'enrolled aal1 update changed (expect 0)', count(*) from public.user_medications where strength='1 mg';
