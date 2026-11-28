# Delete my account: deploy steps (Windows PowerShell)

What it does: the app's "Delete my account" button calls this server function. The function removes the person's files from the `lab-files` bucket, then deletes the sign-in user. Every table row goes with it (`on delete cascade`). The service-role key stays inside Supabase and is never put in the app, the repo or chat. You set no secret for the basic setup.

Do this on your dev project with fake data first.

1. Update the code, then go to the repo folder (the one that contains the `supabase` folder, not `app`):

        git pull
        cd C:\path\to\kidney-health-companion

2. Log in to Supabase. A browser window opens and you approve it. Nothing to paste:

        npx supabase login

3. Link the folder to your project. The project ref is the short id in the dashboard address, `https://supabase.com/dashboard/project/<project-ref>`. It is not a secret key. It may ask for the database password: you can press Enter to skip.

        npx supabase link --project-ref <project-ref>

4. Deploy the function:

        npx supabase functions deploy delete-account

   [Unverified] If it complains that Docker is not running, run the same command with `--use-api` added at the end.

5. Only if you test from a phone or another computer on your network (not localhost and not health.carciente.ca), allow that address. This is a plain address, not a secret:

        npx supabase secrets set ALLOWED_ORIGINS=http://192.168.148.118:8081

6. Test with a throwaway account (not your two main test users): sign up, add a fake blood test with a file, then Profile tab, Delete my account, Yes. You should be signed out. In the Supabase dashboard, Authentication shows the user gone and Storage, `lab-files` shows no folder for that id.

If the button says deletion "is not switched on yet", the function is not deployed to this project. If it says to sign in again with your two-step code, the account has two-step on and the session is not fully verified.

## Checked deployment

2026-11-17: James deployed with the steps above on the dev project and ran step 6 on web with a throwaway account. His report: "worked". No step differed from this guide. [Unverified] He has not yet confirmed in the dashboard that the `lab-files` folder and the table rows were gone for that user; the function removes the folder first and the rows follow from `on delete cascade`.
