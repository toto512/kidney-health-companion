# Senior Health Companion (Expo app)

Phase 2 scaffold. Fake data only. No health facts are shown until sourced content is added.

## Run locally
    cd app
    cp .env.example .env.local   # fill in your Supabase URL and anon key
    npm ci
    npx expo start --web         # or --ios / --android
    npm run typecheck && npm test

## Secrets
Only the public Supabase URL and anon key go in `.env.local` (git-ignored). Row-level security protects data; never put a service-role key in the app or repo.

## Deploy
Not wired yet. The current site at health.carciente.ca is still the single-file draft at the repo root.

## Database
`supabase/migrations/0001_init.sql` (untested against a live project).
