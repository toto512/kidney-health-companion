Local check of migration 0006 on a plain Postgres 16 with a stand-in `auth` schema (not real Supabase):

    psql -f stub_supabase_auth.sql && psql -f ../migrations/0006_mfa_recovery_codes.sql && psql -f 0006_recovery_codes.test.sql

The stub only imitates `auth.uid()`, `auth.jwt()`, `auth.users` and `auth.mfa_factors`. It cannot prove behaviour on real Supabase. Test the real flow in the dev project with fake data.

Migration 0007 (user_conditions): after the stub, run `psql -f ../migrations/0007_user_conditions.sql && psql -f 0007_user_conditions.test.sql`. It checks owner-only rows, the id format check, the two-step rule and that anon is blocked.

Migration 0008 (user_medications): after the stub, run `psql -f ../migrations/0008_user_medications.sql && psql -f 0008_user_medications.test.sql`. It checks owner-only rows, one-kind-per-row, name checks, duplicates, the two-step rule and that anon is blocked.

Migration 0009 (medication strength): after the stub and 0008, run `psql -f ../migrations/0009_medication_strength.sql && psql -f 0009_medication_strength.test.sql`. It checks the strength rules, that only strength can be updated, and that other users and enrolled aal1 sessions cannot change rows.

Migration 0010 (emergency_contacts, "My people"): after the stub, run `psql -f ../migrations/0010_emergency_contacts.sql && psql -f 0010_emergency_contacts.test.sql`. It checks owner-only rows, the E.164 phone format, the name and relationship checks, the five-contact limit, that only name, relationship and phone can be updated, the two-step rule and that anon is blocked.

Migration 0013 (my_day_tasks and my_day_done, "My day"): after the stub, run `psql -f ../migrations/0013_my_day.sql && psql -f 0013_my_day.test.sql`. It checks owner-only rows, one name per task (menu or typed), each menu task once, the 20-task limit, the tick day window (today plus or minus 2 days), that only title, time and days can be updated, the two-step rule and that anon is blocked.

Migration 0014 (My day: more menu tasks and an Afternoon time of day): after the stub, 0013 and its test, run `psql -f 0014_my_day_more_templates.test.sql`. It runs 0014 twice and checks that the new template keys, a kept older key and the Afternoon time are accepted, and that an unknown template, a second copy of a template and an unknown time are refused.

Migration 0015 (My day: 30-task limit): after the stub, 0013 and 0014, run `psql -f 0015_my_day_limit_30.test.sql`. It runs 0015 twice, adds 30 tasks, checks the 31st is refused with the 30-task message and that another person is unaffected.

Migration 0016 (appointments, the Calendar): after the stub, run `psql -f 0016_appointments.test.sql`. It runs 0016 twice and checks owner-only rows, title, note, date, time, repeat and reminder rules, that only the fields the person edits can be updated, the 100-appointment limit with its message, that another person and anon see nothing, and the two-step rule.

Migration 0017 (profiles.calendar_app, the calendar the person says they use): run `psql -f 0017_calendar_app.test.sql` on a fresh scratch database (it makes a small stand-in profiles table). It runs 0017 twice and checks the default is empty, the six choices are accepted and anything else is refused.
