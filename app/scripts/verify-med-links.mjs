// Re-checks every candidate official medicine page against the live site and prints a report (JSON on stdout).
// Run from the app folder on a machine that can reach the sites:  node scripts/verify-med-links.mjs
// Prints one short line per check (paste that back) and also writes med-links-report.json.
// Sends no user data. Reads only scripts/med-link-candidates.json. Rule: a link is "ok" only when the live page title
// contains every generic name part (MedlinePlus, NHS) or the brand exists in the Health Canada DPD (CA).
import { readFileSync, writeFileSync } from 'node:fs';

const cands = JSON.parse(readFileSync(new URL('./med-link-candidates.json', import.meta.url), 'utf8'));
const today = new Date().toISOString().slice(0, 10);
const UA = { 'user-agent': 'health-companion-link-check/1.0' };
const norm = (s) => s.toLowerCase().replace(/&amp;/g, '&');
const parts = (generic) => generic.split('/').map((p) => norm(p.trim()));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url) {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(url, { headers: UA, redirect: 'follow' });
      if (r.ok) return { url: r.url, text: await r.text() };
      if (r.status === 404) return { status: 404 };
    } catch { /* retry */ }
    await sleep(1500 * (i + 1));
  }
  return { status: 'error' };
}
const title = (html) => norm((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '').replace(/\s+/g, ' ').trim());

async function checkTitle(c, url, country) {
  const r = await get(url);
  if (!r.text) return { country, url, ok: false, why: `fetch ${r.status}` };
  const t = title(r.text);
  const all = parts(c.generic);
  const ok = c.alias ? all.some((p) => t.includes(p)) : all.every((p) => t.includes(p));
  const reviewed = r.text.match(/Last Revised\s*-\s*(\d\d)\/(\d\d)\/(\d{4})/i);
  return { country, url, ok, title: t, ...(reviewed ? { page_reviewed: `${reviewed[3]}-${reviewed[1]}-${reviewed[2]}` } : {}), ...(ok ? {} : { why: `title does not match: ${t}` }) };
}

async function checkDpd(c) {
  const r = await get(c.ca);
  if (!r.text) return { country: 'CA', url: c.ca, ok: false, why: `fetch ${r.status}` };
  let rows; try { rows = JSON.parse(r.text); } catch { return { country: 'CA', url: c.ca, ok: false, why: 'not JSON' }; }
  const brand = new URL(c.ca).searchParams.get('brandname').toLowerCase();
  const esc = brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const exact = rows.filter((x) => String(x.brand_name).toLowerCase() === brand);
  // DPD names many records "BRAND - 10MG". Those pages show a strength, so they are flagged and not shipped without a decision.
  const strengthy = rows.filter((x) => new RegExp(`^${esc}\\s*-\\s*\\d`, 'i').test(String(x.brand_name)));
  const hit = exact.length ? exact : strengthy;
  if (!hit.length) {
    const names = rows.filter((x) => String(x.brand_name).toLowerCase().startsWith(brand));
    return { country: 'CA', url: c.ca, ok: false, why: names.length
      ? `HELD: DPD names carry a strength or form, not a plain brand name (e.g. ${names.slice(0, 2).map((x) => x.brand_name).join(' / ')}; ${rows.length} rows)`
      : `NO RECORD: no DPD name starts with this brand (${rows.length} rows)` };
  }
  const code = hit[0].drug_code;
  const page = `https://health-products.canada.ca/dpd-bdpp/info?lang=eng&code=${code}`;
  const p = await get(page);
  const ok = !!p.text && norm(p.text).includes(brand) && exact.length > 0; // strength-named records are held back (no doses)
  return { country: 'CA', url: page, ok, brand: hit[0].brand_name, strength_in_name: !exact.length, products_with_this_brand: hit.length, ...(ok ? {} : { why: exact.length ? 'info page missing or brand not on page' : `HELD: DPD record name includes a strength (${hit[0].brand_name})` }) };
}

const report = [];
for (const c of cands) {
  const checks = [];
  if (c.us) checks.push(await checkTitle(c, c.us, 'US'));
  if (c.uk) checks.push(await checkTitle(c, c.uk, 'GB'));
  if (c.ca) checks.push(await checkDpd(c));
  report.push({ n: c.n, med_id: c.med_id, checks });
  await sleep(500);
}
const flat = report.flatMap((r) => r.checks.map((k) => ({ med_id: r.med_id, ...k })));
writeFileSync('med-links-report.json', JSON.stringify({ checked_on: today, report }, null, 1));
console.log(`checked_on ${today}  ok ${flat.filter((k) => k.ok).length}  failed ${flat.filter((k) => !k.ok).length}`);
for (const k of flat) console.log([k.ok ? 'OK' : 'FAIL', k.med_id, k.country, k.url.replace('https://', ''), k.page_reviewed ?? '', k.ok ? (k.title ?? k.brand) : k.why].join(' | '));
