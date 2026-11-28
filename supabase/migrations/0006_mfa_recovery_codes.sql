-- Recovery codes for optional two-step sign-in.
-- A user who lost their authenticator has only a password-level (aal1) session and cannot remove a verified factor
-- from the client. Redeeming a single-use recovery code removes their authenticators, so they are back to password-only
-- and are told to turn two-step sign-in on again. Codes are stored only as bcrypt hashes.
-- Requires pgcrypto (installed in the "extensions" schema on Supabase).

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.mfa_recovery_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  code_hash text not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists mfa_recovery_codes_user_idx on public.mfa_recovery_codes (user_id);

create table if not exists public.mfa_recovery_attempts (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  at timestamptz not null default now()
);
create index if not exists mfa_recovery_attempts_user_idx on public.mfa_recovery_attempts (user_id, at);

-- No policies: users never read or write these tables directly. Only the functions below touch them.
alter table public.mfa_recovery_codes enable row level security;
alter table public.mfa_recovery_attempts enable row level security;
revoke all on public.mfa_recovery_codes from public, anon, authenticated;
revoke all on public.mfa_recovery_attempts from public, anon, authenticated;

-- Makes 8 new single-use codes (replacing any older set) and returns them in plain text exactly once.
-- Needs two-step sign-in to be on, and a session that passed it (aal2).
create or replace function public.generate_recovery_codes()
returns text[]
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; -- no I, L, O, 0, 1
  codes text[] := '{}';
  c text;
  b bytea;
  i int;
  n int;
begin
  if uid is null then raise exception 'not_signed_in' using errcode = '28000'; end if;
  if not public.has_verified_mfa() then raise exception 'two_step_off' using errcode = 'P0001'; end if;
  if (select auth.jwt() ->> 'aal') is distinct from 'aal2' then raise exception 'aal2_required' using errcode = '42501'; end if;

  delete from public.mfa_recovery_codes where user_id = uid;
  for n in 1..8 loop
    b := extensions.gen_random_bytes(10);
    c := '';
    for i in 0..9 loop
      c := c || substr(alphabet, (get_byte(b, i) % length(alphabet)) + 1, 1);
    end loop;
    insert into public.mfa_recovery_codes (user_id, code_hash)
      values (uid, extensions.crypt(c, extensions.gen_salt('bf', 8)));
    codes := codes || (substr(c, 1, 5) || '-' || substr(c, 6, 5));
  end loop;
  return codes;
end;
$$;

-- How many unused codes the signed-in user still has.
create or replace function public.recovery_codes_remaining()
returns int
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::int from public.mfa_recovery_codes
  where user_id = (select auth.uid()) and used_at is null;
$$;

-- Redeems one code. Works with a password-level session. On success the code is burned and all of the user's
-- authenticators are removed. Returns false for a wrong code; raises too_many_attempts after 5 wrong tries in 15 minutes.
create or replace function public.redeem_recovery_code(p_code text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
  norm text;
  hit uuid;
begin
  if uid is null then raise exception 'not_signed_in' using errcode = '28000'; end if;
  if not public.has_verified_mfa() then raise exception 'two_step_off' using errcode = 'P0001'; end if;
  if (select count(*) from public.mfa_recovery_attempts where user_id = uid and at > now() - interval '15 minutes') >= 5 then
    raise exception 'too_many_attempts' using errcode = 'P0001';
  end if;

  norm := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
  if length(norm) = 10 then
    select id into hit from public.mfa_recovery_codes
      where user_id = uid and used_at is null and code_hash = extensions.crypt(norm, code_hash)
      limit 1 for update;
  end if;

  if hit is null then
    insert into public.mfa_recovery_attempts (user_id) values (uid); -- kept: we return normally, not raise
    return false;
  end if;

  update public.mfa_recovery_codes set used_at = now() where id = hit;
  delete from auth.mfa_factors where user_id = uid;
  delete from public.mfa_recovery_attempts where user_id = uid;
  return true;
end;
$$;

revoke all on function public.generate_recovery_codes() from public, anon;
revoke all on function public.recovery_codes_remaining() from public, anon;
revoke all on function public.redeem_recovery_code(text) from public, anon;
grant execute on function public.generate_recovery_codes() to authenticated;
grant execute on function public.recovery_codes_remaining() to authenticated;
grant execute on function public.redeem_recovery_code(text) to authenticated;
