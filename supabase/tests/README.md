Local check of migration 0006 on a plain Postgres 16 with a stand-in `auth` schema (not real Supabase):

    psql -f stub_supabase_auth.sql && psql -f ../migrations/0006_mfa_recovery_codes.sql && psql -f 0006_recovery_codes.test.sql

The stub only imitates `auth.uid()`, `auth.jwt()`, `auth.users` and `auth.mfa_factors`. It cannot prove behaviour on real Supabase. Test the real flow in the dev project with fake data.
