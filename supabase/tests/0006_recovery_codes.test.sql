\set u1 '00000000-0000-0000-0000-000000000001'
\set u2 '00000000-0000-0000-0000-000000000002'
set role authenticated;
-- 1: aal1 session cannot generate
select set_config('request.jwt.claim.sub', :'u1', false), set_config('request.jwt.claims', '{"aal":"aal1"}', false);
do $$ begin perform public.generate_recovery_codes(); raise exception 'FAIL aal1 allowed'; exception when sqlstate '42501' then raise notice 'ok aal1 blocked'; end $$;
-- 2: aal2 generates 8 codes
select set_config('request.jwt.claims', '{"aal":"aal2"}', false);
create temp table c1 as select unnest(public.generate_recovery_codes()) as code;
select count(*) = 8 as eight, bool_and(code ~ '^[A-HJKMNP-Z2-9]{5}-[A-HJKMNP-Z2-9]{5}$') as fmt from c1;
select public.recovery_codes_remaining() = 8 as remaining8;
-- 3: direct table access denied
do $$ begin perform 1 from public.mfa_recovery_codes; raise exception 'FAIL direct read'; exception when insufficient_privilege then raise notice 'ok direct read denied'; end $$;
-- 4: regenerate invalidates old set
create temp table c2 as select unnest(public.generate_recovery_codes()) as code;
select count(*) from c1 join c2 using (code) \gset
select :count = 0 as sets_differ;
-- 5: aal1 session, wrong code x5 then lockout; right code locked out
select set_config('request.jwt.claims', '{"aal":"aal1"}', false);
select public.redeem_recovery_code('AAAAA-AAAAA') as r1, public.redeem_recovery_code('bad') as r2, public.redeem_recovery_code(null) as r3, public.redeem_recovery_code('AAAAA-AAAAB') as r4, public.redeem_recovery_code('AAAAA-AAAAC') as r5;
select code as good from c2 limit 1 \gset
do $$ begin perform public.redeem_recovery_code((select code from c2 limit 1)); raise exception 'FAIL not locked'; exception when others then if sqlerrm = 'too_many_attempts' then raise notice 'ok locked out'; else raise; end if; end $$;
reset role;
delete from public.mfa_recovery_attempts;
set role authenticated;
select set_config('request.jwt.claim.sub', :'u1', false);
-- 6: correct code (lowercase, no hyphen) works, removes factors, burns code
select public.redeem_recovery_code(lower(replace(:'good','-',''))) as redeemed;
reset role;
select count(*) = 0 as u1_factors_gone from auth.mfa_factors where user_id = :'u1';
select count(*) = 1 as u2_factor_kept from auth.mfa_factors where user_id = :'u2';
select count(*) filter (where used_at is not null) = 1 as one_used from public.mfa_recovery_codes where user_id = :'u1';
-- 7: after factors gone, redeem refuses (two_step_off)
set role authenticated;
select set_config('request.jwt.claim.sub', :'u1', false);
do $$ begin perform public.redeem_recovery_code('AAAAA-AAAAA'); raise exception 'FAIL'; exception when others then raise notice 'ok after: %', sqlerrm; end $$;
-- 8: anon cannot execute
reset role; set role anon;
do $$ begin perform public.redeem_recovery_code('x'); raise exception 'FAIL anon'; exception when insufficient_privilege then raise notice 'ok anon denied'; end $$;
