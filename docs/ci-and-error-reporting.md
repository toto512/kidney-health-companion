# CI and error reporting

## CI (`.github/workflows/ci.yml`)

Independent of `pages.yml`. Runs on pull requests and pushes to `main`.

| Job | What it checks |
| --- | --- |
| `worker-tests` | `worker/` unit tests (`node --test`, upstreams mocked, no install). |
| `lint` | ESLint (correctness rules only: undefined symbols, unreachable code) on `js/`, `worker/`, `site-tests/`; schema check of `data/foods.json` and `manifest.webmanifest`. |
| `site-e2e` | Playwright + axe-core against the files `pages.yml` publishes, served over HTTP. |

`site-tests/site.spec.js` covers:

- Every page loads with no console errors, uncaught exceptions, or CSP violations.
- axe-core (WCAG 2.0/2.1/2.2 A and AA) on every page. Known findings are listed in `KNOWN_AXE`; any new rule fails, and a listed rule that stops firing also fails so the list cannot go stale.
- Manifest validity and icon reachability.
- Unknown-food regression guard: an unknown food shows an enabled "Search online food data" button, is never a green verdict, results from the Worker render with their source, and an empty lookup says "Unknown does not mean safe".

The Worker endpoint is stubbed with `page.route`, so CI never contacts the network.

Run locally: `cd site-tests && npm ci && npx playwright install chromium && npm test` (and `npm run lint`).

`site-tests/serve.mjs` mirrors the publish list in `pages.yml`. When a new published file or directory is added there (for example `sw.js`), add it to `serve.mjs` too.

Recommended repo setting (not changeable from a PR): mark the three jobs as required checks on `main`.

## Error reporting (proposal, not implemented)

This is a static site and the data is health-related. Any hosted collector (Sentry, LogRocket, etc.) receives URLs, stack traces, and potentially DOM or input values, which is a data-flow change and needs an explicit decision.

Options, in order of recommendation:

1. **Local-only log plus user-initiated report.** `window.onerror` and `unhandledrejection` append `{time, message, source, line, appVersion}` to a capped (20 entries) `localStorage` ring buffer. No form values, no URL query. A "Copy diagnostics" button copies that text for the user to paste into an issue or email. No network, no third party, no privacy change.
2. **First-party endpoint on the existing Worker.** `POST /api/report` with a strict schema (message, source, line, version; max 1 KB; rate limited like `/api/food`), stored only in Cloudflare Workers Logs. Opt-in toggle, off by default. Inference: acceptable with that payload limit, but it is a new data flow and the README privacy statement must describe it.
3. **Third-party SaaS.** Not recommended without a signed agreement and scrubbing config; default capture settings are unsafe for health data.

CI already catches the main regression class pre-release (console and CSP errors on every page). Option 1 is a small change in `js/app.js`; it is not included here to keep this PR to CI only.
