# scripts

`verify-med-links.mjs` re-checks the official medicine pages listed in `med-link-candidates.json` against the live sites
(MedlinePlus, NHS, Health Canada DPD) and prints a JSON report. No user data is sent. Run:
`node scripts/verify-med-links.mjs > med-links-report.json` (about 3 minutes, needs Node 18 or newer and internet access).
A link goes into `src/content/medList.ts` only when its check says `ok: true`. Known special cases to review by hand even when ok:
amphetamine/dextroamphetamine (MedlinePlus page is plain amphetamine), budesonide/formoterol (no combined page), and any DPD result
with many products under one brand (the link points to one of them).
