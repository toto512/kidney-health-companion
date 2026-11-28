-- Sex at birth is needed for sex-specific reference ranges (ranges themselves still need sources). Existing RLS on profiles is unchanged.
alter table public.profiles add column if not exists sex_at_birth text check (sex_at_birth in ('female','male','other'));
