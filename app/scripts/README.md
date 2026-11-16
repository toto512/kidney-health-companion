# scripts

`verify-med-links.mjs` re-checks the official medicine pages listed in `med-link-candidates.json` against the live sites
(MedlinePlus, NHS, Health Canada DPD) and prints a JSON report. No user data is sent. Run:
`node scripts/verify-med-links.mjs` (about 3 minutes, needs Node 18 or newer and internet access). It prints one line per check and writes `med-links-report.json`.

Windows: install Node 18+ from nodejs.org if `node -v` fails. Open PowerShell, `cd` to the repo's `app` folder (after `git pull` on the PR 10 branch), run the command, then copy everything it printed and paste it into the chat.
A link goes into `src/content/medList.ts` only when its check says `ok: true`. Known special cases to review by hand even when ok:
amphetamine/dextroamphetamine (MedlinePlus page is plain amphetamine), budesonide/formoterol (no combined page), and any DPD result
with many products under one brand (the link points to one of them).
