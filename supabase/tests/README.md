Local check of migration 0006 on a plain Postgres 16 with a stand-in `auth` schema (not real Supabase):

    psql -f stub_supabase_auth.sql && psql -f ../migrations/0006_mfa_recovery_codes.sql && psql -f 0006_recovery_codes.test.sql

The stub only imitates `auth.uid()`, `auth.jwt()`, `auth.users` and `auth.mfa_factors`. It cannot prove behaviour on real Supabase. Test the real flow in the dev project with fake data.

Migration 0007 (user_conditions): after the stub, run `psql -f ../migrations/0007_user_conditions.sql && psql -f 0007_user_conditions.test.sql`. It checks owner-only rows, the id format check, the two-step rule and that anon is blocked.

Migration 0008 (user_medications): after the stub, run `psql -f ../migrations/0008_user_medications.sql && psql -f 0008_user_medications.test.sql`. It checks owner-only rows, one-kind-per-row, name checks, duplicates, the two-step rule and that anon is blocked.

Migration 0009 (medication strength): after the stub and 0008, run `psql -f ../migrations/0009_medication_strength.sql && psql -f 0009_medication_strength.test.sql`. It checks the strength rules, that only strength can be updated, and that other users and enrolled aal1 sessions cannot change rows.
