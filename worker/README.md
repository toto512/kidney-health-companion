# Food lookup Worker

Cloudflare Worker behind the Food guide "Check a food" search. It queries USDA FoodData Central (FDC) first and falls back to Open Food Facts (OFF) when FDC returns nothing usable or errors.

Nutrient values are passed through from the source. Missing values stay `null`. Nothing is estimated, generated or converted by guess: FDC nutrients with an unexpected unit are dropped, and OFF grams are converted to milligrams (x1000) for sodium, potassium and phosphorus.

## API

`GET /api/food?q=<name>` (q: 2 to 80 characters, letters, digits, space and `.,'&%()-/`)

```json
{
  "query": "rice",
  "foods": [{
    "source": "usda",
    "id": "<fdcId>",
    "description": "<food name from source>",
    "brand": null,
    "dataType": "SR Legacy",
    "per100g": { "sodium_mg": <number|null>, "potassium_mg": <number|null>, "phosphorus_mg": <number|null>, "protein_g": <number|null> },
    "sourceUrl": "https://fdc.nal.usda.gov/fdc-app.html#/food-details/<fdcId>/nutrients"
  }],
  "attribution": [{ "name": "USDA FoodData Central", "url": "https://fdc.nal.usda.gov/", "license": "Public domain (CC0 1.0)" }],
  "note": "..."
}
```

Shape only; values come from the source at request time.

Status codes: 400 invalid query, 403 origin not allowed, 404 path, 405 method, 429 rate limited, 500 secret missing, 502 both sources failed. Zero matches is `200` with `"foods": []`.

## Controls

- CORS: only `ALLOWED_ORIGIN` (`https://health.carciente.ca`, set in `wrangler.toml`). Requests with any other or no `Origin` header get 403. Inference: the Capacitor store apps will send a different origin (for example `https://localhost` or `capacitor://localhost`), so extend this check when the native wrapper is built.
- Rate limit: Workers Rate Limiting binding, 30 requests per 60 s per client IP, per Cloudflare location. Cloudflare documents these limits as approximate ("Requests can exceed this threshold"). Shared mobile/CGNAT IPs can be throttled together.
- Cache: Cache API (custom domain or route only, see deploy step 6), keyed on the lowercased normalized query, 24 h for hits, 10 min for empty results, checked after the rate limit. Results produced after any upstream failure (partial or total) are never cached and are sent with `Cache-Control: no-store`. The cache is per Cloudflare location.
- The FDC key is sent in the `X-Api-Key` header, never in a URL, and never returned to the client.

## Deploy (not done from this repo's CI)

Requires your Cloudflare account.

1. `cd worker && npm install`
2. `npx wrangler login`
3. Get an FDC key at https://fdc.nal.usda.gov/api-key-signup (free, api.data.gov).
4. `npx wrangler secret put FDC_API_KEY` and paste the key. (For local dev, put `FDC_API_KEY=...` in `worker/.dev.vars`, which is git-ignored.)
5. `npx wrangler deploy`
6. Pick the public URL and make `index.html` match:
   - `index.html` currently uses `https://food-api.carciente.ca/api/food` (`FOOD_API_URL`) and the CSP `connect-src` lists `https://food-api.carciente.ca`. This hostname is a placeholder.
   - Custom domain (needs the `carciente.ca` zone on Cloudflare): add to `wrangler.toml`
     ```toml
     routes = [{ pattern = "food-api.carciente.ca", custom_domain = true }]
     ```
     and redeploy.
   - Or use the `*.workers.dev` URL printed by deploy: change `FOOD_API_URL` and the CSP host in `index.html` to it. Cloudflare's Cache docs: "Workers deployed to custom domains have access to functional cache operations." Inference: on `*.workers.dev` the Cache API does not cache, so every request that passes the rate limiter reaches USDA/OFF and counts against the FDC quota. Prefer the custom domain.
7. Verify: `curl -H "Origin: https://health.carciente.ca" "https://<worker-host>/api/food?q=rice"`.

Rate limiter `namespace_id` ("1001") must be unique within your account; change it if taken.

## Tests

`cd worker && npm test` (Node 20+, no network; upstreams are mocked).

## Attribution

USDA FoodData Central data is public domain (CC0 1.0). Open Food Facts data is under ODbL 1.0; keep the attribution returned in `attribution` visible wherever OFF values are shown. The UI shows the `attribution` entries (name and licence) with each result list and stores them with saved references.
