-- Which calendar the person says they use (google, outlook, apple, another one, none, not sure). Null means they were not asked or skipped.
-- Only the choice is stored. The app does not connect to any calendar. Row-level security on profiles is unchanged (own row only). Safe to run twice.
alter table public.profiles
  add column if not exists calendar_app text;

alter table public.profiles drop constraint if exists profiles_calendar_app_check;
alter table public.profiles
  add constraint profiles_calendar_app_check check (calendar_app is null or calendar_app in ('google','outlook','apple','other','none','unsure'));
