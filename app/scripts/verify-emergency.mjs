// Checks that each candidate quote appears on its official page, and prints one line per candidate.
// Run from the app folder on a machine that can reach the sites:  node scripts/verify-emergency.mjs
// Reads only scripts/emergency-candidates.json (public pages, no user data). A candidate is added to
// src/content/emergency.ts only when its line says OK. PDFs and pages that block scripts are reported as MANUAL.
import { readFileSync } from 'node:fs';

const cands = JSON.parse(readFileSync(new URL('./emergency-candidates.json', import.meta.url), 'utf8'));
const flat = (s) => s.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#0?39;|&apos;|&rsquo;|’/g, "'").replace(/&quot;/g, '"')
  .replace(/\s+/g, ' ').trim().toLowerCase();
const today = new Date().toISOString().slice(0, 10);
console.log(`checked_on ${today}`);
for (const c of cands) {
  let line;
  try {
    const r = await fetch(c.url, { headers: { 'user-agent': 'health-companion-emergency-check/1.0' }, redirect: 'follow' });
    const type = r.headers.get('content-type') ?? '';
    if (!r.ok) line = `MANUAL | HTTP ${r.status}`;
    else if (type.includes('pdf')) line = 'MANUAL | PDF, open it and look for the quote';
    else {
      const text = flat(await r.text());
      const q = flat(c.quote);
      const ok = text.includes(q) && c.tokens.every((t) => q.includes(t.toLowerCase()));
      const upd = text.match(/(?:updated|aggiornat\w*|mis à jour|actualisation|stand|letzte aktualisierung|modifi\w+)[^0-9]{0,20}(\d{1,2}[./ -]\w+[./ -]\d{4}|\d{4}-\d{2}-\d{2})/i);
      line = ok ? `OK | page date: ${upd ? upd[1] : 'none found'}` : 'MANUAL | quote not found in the page text (page may be script-rendered or blocked)';
    }
  } catch (e) { line = `MANUAL | ${e.message}`; }
  console.log([c.code, c.name, c.url.replace('https://', ''), line].join(' | '));
}
