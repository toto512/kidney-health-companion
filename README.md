# Kidney Health Companion — GitHub Pages package

This package contains the standalone web app and a GitHub Actions workflow that publishes it to GitHub Pages when pushed to `main`.

The app stores profile and tracking entries in the visitor's browser on that device. It does not sync data between devices or send it to a server. Do not enter information you do not want saved in that browser.

Exception: the "Check a food" online search sends the typed food name to the food lookup Worker in `worker/`, which queries USDA FoodData Central and Open Food Facts. If nothing matches, the food name is also sent to the Wikipedia search API (`en.wikipedia.org`) to suggest a spelling. No profile or health data is sent. See `worker/README.md`.
