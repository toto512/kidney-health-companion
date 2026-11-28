-- Blood test results. Two tables plus one private file bucket.
--   lab_reports : one row per uploaded file (PDF or photo) or typed entry; points at the original in the bucket.
--   lab_results : one row per confirmed value (test, number, unit, date, lab). Saved only after the person confirms it in the app.
-- Only the owner can read, add, change or remove anything. Same two-step rule as the other tables: a person with a verified
-- authenticator needs an aal2 session. Requires 0005 (has_verified_mfa). Fake data only until the Supabase region is settled.
-- The app reads text from the image on the device. Nothing is sent to an OCR or AI service.

-- 0001 created an unused placeholder public.lab_results (columns test_name, confirmed_at). The app never wrote to it. Replace it with the
-- design below, but only while it still has the old column, so running this file twice never deletes confirmed results.
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'lab_results' and column_name = 'test_name') then
    drop table public.lab_results;
  end if;
end $$;

create table if not exists public.lab_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  taken_on date not null check (taken_on between date '1900-01-01' and current_date + 1),
  lab text check (lab is null or length(lab) between 1 and 80),
  -- Path of the original in the lab-files bucket: <user_id>/<report id>.<ext>. Null when the person typed values without a file.
  file_path text check (file_path is null or file_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(pdf|jpg|jpeg|png|webp)$'),
  file_type text check (file_type is null or file_type in ('application/pdf','image/jpeg','image/png','image/webp')),
  created_at timestamptz not null default now()
);
create index if not exists lab_reports_user_idx on public.lab_reports (user_id, taken_on desc);

create table if not exists public.lab_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  report_id uuid not null references public.lab_reports (id) on delete cascade,
  test text not null check (test in ('creatinine','egfr','urea','potassium','sodium','uric_acid','hba1c','glucose')),
  value numeric not null check (value >= 0 and value < 100000),
  unit text not null check (length(unit) between 1 and 20),
  taken_on date not null,
  -- True when the person changed the value the camera read.
  corrected boolean not null default false,
  created_at timestamptz not null default now(),
  unique (report_id, test)
);
create index if not exists lab_results_user_idx on public.lab_results (user_id, test, taken_on);

-- A result must belong to the same person as its report.
create or replace function public.lab_results_same_owner() returns trigger
language plpgsql security invoker set search_path = public as $$
begin
  if not exists (select 1 from public.lab_reports r where r.id = new.report_id and r.user_id = new.user_id) then
    raise exception 'Report not found.' using errcode = 'check_violation';
  end if;
  return new;
end $$;
drop trigger if exists lab_results_same_owner_trg on public.lab_results;
create trigger lab_results_same_owner_trg before insert or update on public.lab_results
  for each row execute function public.lab_results_same_owner();

alter table public.lab_reports enable row level security;
alter table public.lab_results enable row level security;
revoke all on public.lab_reports, public.lab_results from public, anon;
grant select, insert, delete on public.lab_reports, public.lab_results to authenticated;
grant update (taken_on, lab) on public.lab_reports to authenticated;
grant update (value, unit, taken_on, corrected) on public.lab_results to authenticated;

do $$
declare t text;
begin
  foreach t in array array['lab_reports','lab_results'] loop
    execute format('drop policy if exists %1$s_select_own on public.%1$s', t);
    execute format('drop policy if exists %1$s_insert_own on public.%1$s', t);
    execute format('drop policy if exists %1$s_update_own on public.%1$s', t);
    execute format('drop policy if exists %1$s_delete_own on public.%1$s', t);
    execute format('drop policy if exists require_aal2_if_enrolled on public.%1$s', t);
    execute format('create policy %1$s_select_own on public.%1$s for select to authenticated using (user_id = (select auth.uid()))', t);
    execute format('create policy %1$s_insert_own on public.%1$s for insert to authenticated with check (user_id = (select auth.uid()))', t);
    execute format('create policy %1$s_update_own on public.%1$s for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))', t);
    execute format('create policy %1$s_delete_own on public.%1$s for delete to authenticated using (user_id = (select auth.uid()))', t);
    execute format($p$create policy require_aal2_if_enrolled on public.%1$s as restrictive for all to authenticated
      using ((auth.jwt() ->> 'aal') = 'aal2' or not public.has_verified_mfa())
      with check ((auth.jwt() ->> 'aal') = 'aal2' or not public.has_verified_mfa())$p$, t);
  end loop;
end $$;

-- Private bucket for the originals: 10 MB per file, PDF and common photo types only, never public.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('lab-files', 'lab-files', false, 10485760, array['application/pdf','image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = false, file_size_limit = 10485760,
  allowed_mime_types = array['application/pdf','image/jpeg','image/png','image/webp'];

-- Each person can reach only files whose first folder is their own user id. Restrictive two-step rule applies to this bucket only.
drop policy if exists lab_files_select_own on storage.objects;
drop policy if exists lab_files_insert_own on storage.objects;
drop policy if exists lab_files_delete_own on storage.objects;
drop policy if exists lab_files_require_aal2 on storage.objects;

create policy lab_files_select_own on storage.objects for select to authenticated
  using (bucket_id = 'lab-files' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy lab_files_insert_own on storage.objects for insert to authenticated
  with check (bucket_id = 'lab-files' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy lab_files_delete_own on storage.objects for delete to authenticated
  using (bucket_id = 'lab-files' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy lab_files_require_aal2 on storage.objects as restrictive for all to authenticated
  using (bucket_id <> 'lab-files' or (auth.jwt() ->> 'aal') = 'aal2' or not public.has_verified_mfa())
  with check (bucket_id <> 'lab-files' or (auth.jwt() ->> 'aal') = 'aal2' or not public.has_verified_mfa());
