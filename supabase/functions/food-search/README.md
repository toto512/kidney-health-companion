# Food search (USDA FoodData Central): deploy steps (Windows PowerShell)

What it does: on a food page that says "No official numbers yet", the person can search USDA FoodData Central from inside the app. The app calls this server function. The function holds your free api.data.gov key and asks FoodData Central (Foundation Foods and SR Legacy records only, no brand records). The key never goes in the app, the repo or chat. Free: the key costs nothing and Supabase Free includes Edge Functions.

Limits (from the official FoodData Central API guide, https://fdc.nal.usda.gov/api-guide/): "1,000 requests per hour per IP address". Going over blocks the key for 1 hour. Every request from this function comes from the same Supabase address, so the function lets each person run 30 searches an hour (best effort) and shows "busy" if USDA answers 429.

1. Get the free key. Open https://fdc.nal.usda.gov/api-key-signup (the FoodData Central "Get an API Key" page). Enter your name and email and submit. The key arrives by email within a minute. Do not paste it in chat.

2. Update the code and go to the repo folder (the one with the `supabase` folder):

        git pull
        cd C:\path\to\kidney-health-companion

3. Store the key inside Supabase. In PowerShell replace PASTE_KEY_HERE with the key from the email, press Enter, then close the window:

        npx supabase secrets set FDC_API_KEY=PASTE_KEY_HERE

   (Or in the dashboard: Project, Edge Functions, Secrets, add `FDC_API_KEY`.)

4. Deploy the function:

        npx supabase functions deploy food-search

   [Unverified] If it complains that Docker is not running, add `--use-api` at the end.

5. Only if you test from a phone or another computer on your network, allow that address (a plain address, not a secret). Skip it if you already did this for delete-account:

        npx supabase secrets set ALLOWED_ORIGINS=http://192.168.148.118:8081

6. Test: sign in, Food, open a food that says "No official numbers yet" (for example Muesli), press Search. You should see USDA records. Tap one to see sodium, potassium, phosphorus and protein per 100 g with the record name and link.

If the app says search "is not switched on yet", the key or the function is missing on this project. If it says "too many searches", wait an hour.

[Unverified] The request format follows the published API spec; it was not run against the live API from the build environment (the shared test key was rate limited), so step 6 is the first real test.
