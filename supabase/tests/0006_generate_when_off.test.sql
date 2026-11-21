set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false), set_config('request.jwt.claims','{"aal":"aal1"}',false);
do $$ begin perform public.generate_recovery_codes(); raise exception 'FAIL'; exception when others then raise notice 'generate with two-step off: % / %', sqlstate, sqlerrm; end $$;
select public.recovery_codes_remaining() as remaining_when_off;
