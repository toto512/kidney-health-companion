create role anon nologin; create role authenticated nologin;
create schema auth; create schema extensions;
create table auth.users(id uuid primary key);
create table auth.mfa_factors(id uuid primary key default gen_random_uuid(), user_id uuid references auth.users, status text);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims', true),''),'{}')::jsonb $$;
create function public.has_verified_mfa() returns boolean language sql stable security definer set search_path='' as $$
  select exists (select 1 from auth.mfa_factors f where f.user_id = (select auth.uid()) and f.status='verified'); $$;
grant usage on schema public, auth to authenticated;
insert into auth.users values ('00000000-0000-0000-0000-000000000001'),('00000000-0000-0000-0000-000000000002');
insert into auth.mfa_factors(user_id,status) values ('00000000-0000-0000-0000-000000000001','verified'),('00000000-0000-0000-0000-000000000002','verified');
