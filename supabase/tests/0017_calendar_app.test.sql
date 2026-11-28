\set ON_ERROR_STOP on
-- Run on a fresh scratch database. Uses a small stand-in for public.profiles (the real one comes from 0001), see README.
create table public.profiles (user_id uuid primary key, name text);
\i ../migrations/0017_calendar_app.sql
\i ../migrations/0017_calendar_app.sql
insert into public.profiles(user_id) values ('00000000-0000-0000-0000-000000000001');
select 'default is null (expect t)', calendar_app is null from public.profiles;
update public.profiles set calendar_app='google';
update public.profiles set calendar_app=null;
do $$ declare v text; begin
  foreach v in array array['google','outlook','apple','other','none','unsure'] loop
    update public.profiles set calendar_app=v;
  end loop;
  raise notice 'ok: all six choices accepted';
  begin update public.profiles set calendar_app='yahoo'; raise exception 'FAIL: unknown value'; exception when check_violation then raise notice 'ok: unknown value rejected'; end;
  begin update public.profiles set calendar_app=''; raise exception 'FAIL: empty value'; exception when check_violation then raise notice 'ok: empty value rejected'; end;
end $$;
