\set ON_ERROR_STOP on
-- Run after stub_supabase_auth.sql, 0013 and 0013's test (see README). Fresh data for this file.
\i ../migrations/0014_my_day_more_templates.sql
\i ../migrations/0014_my_day_more_templates.sql
delete from public.my_day_done; delete from public.my_day_tasks;
delete from auth.mfa_factors where user_id='00000000-0000-0000-0000-000000000002';
set role authenticated;
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000002';
set request.jwt.claims='{"aal":"aal1"}';
-- new templates, an old (legacy) template and the new Afternoon time are accepted
insert into public.my_day_tasks(user_id, template_key, time_of_day) values
  ('00000000-0000-0000-0000-000000000002','bathroom','morning'),
  ('00000000-0000-0000-0000-000000000002','afternoon-medicines','afternoon'),
  ('00000000-0000-0000-0000-000000000002','night-medicines','bedtime'),
  ('00000000-0000-0000-0000-000000000002','meal','midday');
insert into public.my_day_tasks(user_id, title, time_of_day) values ('00000000-0000-0000-0000-000000000002','Read','afternoon');
select 'accepted (expect 5)', count(*) from public.my_day_tasks;
do $$ begin
  begin insert into public.my_day_tasks(user_id, template_key, time_of_day) values ('00000000-0000-0000-0000-000000000002','flying','midday'); raise exception 'FAIL: unknown template'; exception when check_violation then raise notice 'ok: unknown template refused'; end;
  begin insert into public.my_day_tasks(user_id, template_key, time_of_day) values ('00000000-0000-0000-0000-000000000002','bathroom','evening'); raise exception 'FAIL: duplicate template'; exception when unique_violation then raise notice 'ok: template once per person'; end;
  begin insert into public.my_day_tasks(user_id, template_key, time_of_day) values ('00000000-0000-0000-0000-000000000002','dinner','supper'); raise exception 'FAIL: bad time'; exception when check_violation then raise notice 'ok: unknown time refused'; end;
end $$;
-- a task saved before 0014 (old template key, old time) is still there and still editable
update public.my_day_tasks set time_of_day='evening' where template_key='meal';
select 'old template moved to evening (expect 1)', count(*) from public.my_day_tasks where template_key='meal' and time_of_day='evening';
