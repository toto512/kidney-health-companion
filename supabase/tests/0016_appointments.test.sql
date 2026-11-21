\set ON_ERROR_STOP on
-- Run on a fresh scratch database after stub_supabase_auth.sql (see README).
\i ../migrations/0016_appointments.sql
\i ../migrations/0016_appointments.sql
delete from auth.mfa_factors where user_id='00000000-0000-0000-0000-000000000002';
set role authenticated;
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000002';
set request.jwt.claims='{"aal":"aal1"}';
insert into public.appointments(user_id, title, note, starts_on, starts_at, repeat, remind_minutes) values ('00000000-0000-0000-0000-000000000002','Clinic','Bring the list','2026-12-01','09:30','monthly',1440);
insert into public.appointments(user_id, title, starts_on, starts_at) values ('00000000-0000-0000-0000-000000000002','Blood test','2026-12-02','08:00');
select 'own appointments (expect 2)', count(*) from public.appointments;
select 'defaults (expect none, 0)', repeat, remind_minutes from public.appointments where title='Blood test';
do $$ begin
  begin insert into public.appointments(user_id, title, starts_on, starts_at) values ('00000000-0000-0000-0000-000000000001','Other','2026-12-01','09:00'); raise exception 'FAIL: inserted for another user'; exception when insufficient_privilege then raise notice 'ok: other-user insert blocked'; end;
  begin insert into public.appointments(user_id, title, starts_on, starts_at) values ('00000000-0000-0000-0000-000000000002','','2026-12-01','09:00'); raise exception 'FAIL: empty title'; exception when check_violation then raise notice 'ok: empty title rejected'; end;
  begin insert into public.appointments(user_id, title, starts_on, starts_at) values ('00000000-0000-0000-0000-000000000002',' padded ','2026-12-01','09:00'); raise exception 'FAIL: padded title'; exception when check_violation then raise notice 'ok: untrimmed title rejected'; end;
  begin insert into public.appointments(user_id, title, starts_on, starts_at) values ('00000000-0000-0000-0000-000000000002',repeat('a',61),'2026-12-01','09:00'); raise exception 'FAIL: long title'; exception when check_violation then raise notice 'ok: 61 characters rejected'; end;
  begin insert into public.appointments(user_id, title, note, starts_on, starts_at) values ('00000000-0000-0000-0000-000000000002','Long note',repeat('n',201),'2026-12-01','09:00'); raise exception 'FAIL: long note'; exception when check_violation then raise notice 'ok: 201-character note rejected'; end;
  begin insert into public.appointments(user_id, title, note, starts_on, starts_at) values ('00000000-0000-0000-0000-000000000002','Empty note','','2026-12-01','09:00'); raise exception 'FAIL: empty note'; exception when check_violation then raise notice 'ok: empty note rejected (use null)'; end;
  begin insert into public.appointments(user_id, title, starts_on, starts_at) values ('00000000-0000-0000-0000-000000000002','Old','1999-12-31','09:00'); raise exception 'FAIL: date before 2000'; exception when check_violation then raise notice 'ok: date before 2000 rejected'; end;
  begin insert into public.appointments(user_id, title, starts_on, starts_at) values ('00000000-0000-0000-0000-000000000002','Far','2101-01-01','09:00'); raise exception 'FAIL: date after 2100'; exception when check_violation then raise notice 'ok: date after 2100 rejected'; end;
  begin insert into public.appointments(user_id, title, starts_on, starts_at) values ('00000000-0000-0000-0000-000000000002','Seconds','2026-12-01','09:00:30'); raise exception 'FAIL: seconds'; exception when check_violation then raise notice 'ok: time with seconds rejected'; end;
  begin insert into public.appointments(user_id, title, starts_on, starts_at, repeat) values ('00000000-0000-0000-0000-000000000002','Daily','2026-12-01','09:00','daily'); raise exception 'FAIL: unknown repeat'; exception when check_violation then raise notice 'ok: unknown repeat rejected'; end;
  begin insert into public.appointments(user_id, title, starts_on, starts_at, remind_minutes) values ('00000000-0000-0000-0000-000000000002','Odd','2026-12-01','09:00',45); raise exception 'FAIL: odd reminder'; exception when check_violation then raise notice 'ok: unknown reminder rejected'; end;
end $$;
-- editing: owner column cannot change; the rest can
update public.appointments set title='Clinic visit', starts_at='10:00', repeat='weekly', remind_minutes=60 where title='Clinic';
select 'edited (expect Clinic visit, 10:00:00)', title, starts_at from public.appointments where title='Clinic visit';
do $$ begin
  begin update public.appointments set user_id='00000000-0000-0000-0000-000000000001' where title='Clinic visit'; raise exception 'FAIL: owner changed'; exception when insufficient_privilege then raise notice 'ok: owner column cannot be updated'; end;
end $$;
-- the 100-appointment limit: 2 exist, add 98 more, the 101st is refused
insert into public.appointments(user_id, title, starts_on, starts_at) select '00000000-0000-0000-0000-000000000002', 'Visit ' || g, '2026-12-03', '09:00' from generate_series(1, 98) g;
do $$ begin
  begin insert into public.appointments(user_id, title, starts_on, starts_at) values ('00000000-0000-0000-0000-000000000002','One too many','2026-12-03','09:00'); raise exception 'FAIL: 101st appointment'; exception when check_violation then
    if sqlerrm <> 'You can save up to 100 appointments.' then raise exception 'FAIL: wrong message: %', sqlerrm; end if;
    raise notice 'ok: 101st appointment refused with the limit message'; end;
end $$;
-- another person sees and changes nothing; anon is blocked
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
select 'other user sees (expect 0)', count(*) from public.appointments;
update public.appointments set title='Hacked';
delete from public.appointments;
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000002';
select 'untouched (expect 0 hacked, 100 total)', (select count(*) from public.appointments where title='Hacked'), (select count(*) from public.appointments);
reset role;
set role anon;
do $$ begin
  begin perform count(*) from public.appointments; raise exception 'FAIL: anon read'; exception when insufficient_privilege then raise notice 'ok: anon blocked'; end;
end $$;
reset role;
-- two-step rule: enrolled person on aal1 is blocked, aal2 works
insert into auth.mfa_factors(user_id, status) values ('00000000-0000-0000-0000-000000000002','verified');
set role authenticated;
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000002';
do $$ begin
  begin insert into public.appointments(user_id, title, starts_on, starts_at) values ('00000000-0000-0000-0000-000000000002','Enrolled','2026-12-04','09:00'); raise exception 'FAIL: aal1 write allowed'; exception when insufficient_privilege then raise notice 'ok: enrolled aal1 write blocked'; end;
end $$;
select 'enrolled aal1 reads (expect 0)', count(*) from public.appointments;
set request.jwt.claims='{"aal":"aal2"}';
select 'enrolled aal2 reads (expect 100)', count(*) from public.appointments;
delete from public.appointments;
select 'after delete (expect 0)', count(*) from public.appointments;
