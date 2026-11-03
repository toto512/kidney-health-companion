# Kidney Health Companion — GitHub Pages package

This package contains the standalone web app and a GitHub Actions workflow that publishes it to GitHub Pages when pushed to `main`.

The app stores profile and tracking entries in the visitor's browser on that device. It does not sync data between devices or send it to a server. Do not enter information you do not want saved in that browser.

Online food lookup: when a food is not in the built-in list, the food name you typed is sent to USDA FoodData Central (api.nal.usda.gov). If USDA returns no results, the query is sent to Wikipedia (en.wikipedia.org) for a spelling suggestion. If Wikipedia returns a different suggestion, that suggestion is sent in a second USDA lookup. Profile, medications and readings are not included in these lookup requests.
