# Kidney Health Companion — GitHub Pages package

This package contains the standalone web app and a GitHub Actions workflow that publishes it to GitHub Pages when pushed to `main`.

The app stores profile and tracking entries in the visitor's browser on that device. It does not sync data between devices or send it to a server. Do not enter information you do not want saved in that browser.

Exception: the "Check a food" online search sends the typed food name to the food lookup Worker in `worker/`, which queries USDA FoodData Central and Open Food Facts. No profile or health data is sent. See `worker/README.md`.

## Layout

- `index.html`: markup and styles only.
- `js/app.js`, `js/data.js`, `js/meds.js`: ES modules. `data.js` is the only place that knows where data lives.
- `data/foods.json`: food reference list (edit this to change foods; no code change needed).
- `guides/*.html`: clinical reference documents shown in the guide viewer.

Modules and `fetch` need an HTTP origin: `python3 -m http.server` for local work. Opening `index.html` from `file://` will not load the food list. A Capacitor web view serves from an HTTP(S) origin, so it is unaffected.
