\set ON_ERROR_STOP on
-- Run on a fresh scratch database after stub_supabase_auth.sql (see README).
\i ../migrations/0010_emergency_contacts.sql
\i ../migrations/0010_emergency_contacts.sql
delete from auth.mfa_factors where user_id='00000000-0000-0000-0000-000000000002';
set role authenticated;
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000002';
set request.jwt.claims='{"aal":"aal1"}';
insert into public.emergency_contacts(user_id, name, relationship, phone) values ('00000000-0000-0000-0000-000000000002','Dr Test','doctor','+16135550100');
insert into public.emergency_contacts(user_id, name, relationship, phone) values ('00000000-0000-0000-0000-000000000002','Test Child','child','+447700900123');
select 'own rows (expect 2)', count(*) from public.emergency_contacts;
do $$ begin
  begin insert into public.emergency_contacts(user_id, name, relationship, phone) values ('00000000-0000-0000-0000-000000000001','X','friend','+16135550100'); raise exception 'FAIL: inserted for another user'; exception when insufficient_privilege then raise notice 'ok: other-user insert blocked'; end;
  begin insert into public.emergency_contacts(user_id, name, relationship, phone) values ('00000000-0000-0000-0000-000000000002','X','friend','6135550100'); raise exception 'FAIL: no plus'; exception when check_violation then raise notice 'ok: phone without plus rejected'; end;
  begin insert into public.emergency_contacts(user_id, name, relationship, phone) values ('00000000-0000-0000-0000-000000000002','X','friend','+1 613 555 0100'); raise exception 'FAIL: spaces'; exception when check_violation then raise notice 'ok: phone with spaces rejected'; end;
  begin insert into public.emergency_contacts(user_id, name, relationship, phone) values ('00000000-0000-0000-0000-000000000002','X','friend','+0123456789'); raise exception 'FAIL: leading zero'; exception when check_violation then raise notice 'ok: country code starting 0 rejected'; end;
  begin insert into public.emergency_contacts(user_id, name, relationship, phone) values ('00000000-0000-0000-0000-000000000002','X','friend','+1234567'); raise exception 'FAIL: unreachable check'; exception when others then null; end;
end $$;
do $$ begin
  begin insert into public.emergency_contacts(user_id, name, relationship, phone) values ('00000000-0000-0000-0000-000000000002','X','boss','+16135550100'); raise exception 'FAIL: bad relationship'; exception when check_violation then raise notice 'ok: unknown relationship rejected'; end;
  begin insert into public.emergency_contacts(user_id, name, relationship, phone) values ('00000000-0000-0000-0000-000000000002',' padded ','friend','+16135550100'); raise exception 'FAIL: padded name'; exception when check_violation then raise notice 'ok: untrimmed name rejected'; end;
  begin insert into public.emergency_contacts(user_id, name, relationship, phone) values ('00000000-0000-0000-0000-000000000002',repeat('a',61),'friend','+16135550100'); raise exception 'FAIL: long name'; exception when check_violation then raise notice 'ok: 61 characters rejected'; end;
end $$;
-- the five-contact limit: rows 3, 4 and 5 succeed, the sixth is refused
insert into public.emergency_contacts(user_id, name, relationship, phone) values ('00000000-0000-0000-0000-000000000002','Three','friend','+16135550103');
insert into public.emergency_contacts(user_id, name, relationship, phone) values ('00000000-0000-0000-0000-000000000002','Four','friend','+16135550104');
insert into public.emergency_contacts(user_id, name, relationship, phone) values ('00000000-0000-0000-0000-000000000002','Five','friend','+16135550105');
do $$ begin
  begin insert into public.emergency_contacts(user_id, name, relationship, phone) values ('00000000-0000-0000-0000-000000000002','Six','friend','+16135550106'); raise exception 'FAIL: sixth contact'; exception when check_violation then raise notice 'ok: sixth contact refused'; end;
end $$;
-- editing: name, relationship and phone can change; the owner column cannot
update public.emergency_contacts set phone='+16135550199' where name='Three';
do $$ begin
  begin update public.emergency_contacts set user_id='00000000-0000-0000-0000-000000000001' where name='Three'; raise exception 'FAIL: owner changed'; exception when insufficient_privilege then raise notice 'ok: owner column cannot be updated'; end;
end $$;
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
select 'other user sees (expect 0)', count(*) from public.emergency_contacts;
update public.emergency_contacts set name='Hacked';
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000002';
select 'untouched by other user (expect 0)', count(*) from public.emergency_contacts where name='Hacked';
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
do $$ begin
  begin insert into public.emergency_contacts(user_id, name, relationship, phone) values ('00000000-0000-0000-0000-000000000001','E','friend','+16135550100'); raise exception 'FAIL: aal1 write allowed'; exception when insufficient_privilege then raise notice 'ok: enrolled aal1 write blocked'; end;
end $$;
set request.jwt.claims='{"aal":"aal2"}';
insert into public.emergency_contacts(user_id, name, relationship, phone) values ('00000000-0000-0000-0000-000000000001','E','friend','+16135550100');
delete from public.emergency_contacts where name='E';
select 'after delete (expect 0)', count(*) from public.emergency_contacts;
reset role;
do $$ begin set role anon; begin perform 1 from public.emergency_contacts; raise exception 'FAIL: anon read'; exception when insufficient_privilege then raise notice 'ok: anon blocked'; end; end $$;
