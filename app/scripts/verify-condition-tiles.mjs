// Checks that every quote in src/content/conditionTiles.ts appears word for word on its official page, and prints one line per quote.
// Run from the app folder on a machine that can reach the sites:  node --no-warnings --experimental-strip-types scripts/verify-condition-tiles.mjs
// Reads only the public tile content (no user data). An item should stay only while all of its lines say OK.
// MANUAL means the page could not be read by a script (blocked or script-rendered): open the page and look for the quote.
import { TILES, TILE_SOURCES } from '../src/content/conditionTiles.ts';

const flat = (s) => s.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ')
  .replace(/&shy;|&#173;|&#xad;|[\u00ad\u200b\u200c\u200d\ufeff]/gi, '').replace(/&nbsp;|&#160;|&#xa0;|\u00a0|\u202f|\u2009/gi, ' ').replace(/&amp;/g, '&').replace(/&#0?39;|&#x27;|&#x2019;|&#8217;|&apos;|&rsquo;|&lsquo;|&#8216;|&#x2018;|’|‘/g, "'").replace(/&quot;|&ldquo;|&rdquo;|&#8220;|&#8221;|&#x201c;|&#x201d;|“|”/g, '"')
  .replace(/&ndash;|&mdash;|&#8211;|&#8212;|&#x2013;|&#x2014;|–|—/g, '-').replace(/&frac12;/g, '½').replace(/\s+/g, ' ').replace(/ ([.,;:!?)])/g, '$1').replace(/\( /g, '(').trim().toLowerCase();


// Loose comparison: letters and digits only. A loose match means the words are on the page but spacing or punctuation differs (compare by eye).
const squash = (s) => s.replace(/[^a-z0-9]/g, '');
const pageRaw = new Map();
// Prints what the script actually received near a missing quote, so a page that is blocked, cookie-walled or rewritten can be told apart from a wording change.
function debugNear(id, q) {
  const t = pages.get(id);
  if (typeof t !== 'string') return '';
  const words = flat(q).split(' ');
  const probe = words.slice(0, 4).join(' ');
  const at = t.indexOf(probe);
  const raw = pageRaw.get(id) ?? '';
  const title = (raw.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '').replace(/\s+/g, ' ').trim();
  const fu = finalUrls.get(id);
  const d = `url ${TILE_SOURCES[id].url}${fu && fu !== TILE_SOURCES[id].url ? `; REDIRECTED to ${fu}` : '; no redirect'}; page text ${t.length} chars, title "${title.slice(0, 80)}"; first four words ${at < 0 ? `NOT on the page; page starts: "${t.slice(0, 160)}"` : `found, page says: "${t.slice(at, at + flat(q).length + 40)}"`}`;
  console.log(`    debug: ${d}`);
  return d;
}

// A browser-like user agent: some sites (NHS) answer a script's agent with a different page than the one a browser gets (found 2026-11-18).
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
const finalUrls = new Map();
const redirects = [];
const pages = new Map();
async function page(id) {
  if (pages.has(id)) return pages.get(id);
  let res;
  try {
    const r = await fetch(TILE_SOURCES[id].url, { headers: { 'user-agent': UA, accept: 'text/html,application/xhtml+xml', 'accept-language': 'en' }, redirect: 'follow' });
    finalUrls.set(id, r.url);
    const path = (u) => new URL(u).pathname.replace(/\/+$/, '');
    if (r.ok && path(r.url) !== path(TILE_SOURCES[id].url)) { redirects.push(`${id}: ${TILE_SOURCES[id].url} -> ${r.url}`); res = { error: `REDIRECTED to ${r.url}: the stored address no longer shows this page, re-source it` }; }
    else if (!r.ok) res = { error: `HTTP ${r.status}` };
    else if (/pdf/i.test(r.headers.get('content-type') ?? '') || /\.pdf($|\?)/i.test(TILE_SOURCES[id].url)) res = { error: 'PDF, text cannot be read by this script: open the PDF and search for the line' };
    else { const raw = await r.text(); pageRaw.set(id, raw); res = flat(raw); }

  } catch (e) {
    res = { error: String(e.message ?? e) };
  }
  pages.set(id, res);
  return res;
}

let ok = 0, manual = 0, bad = 0;
const notFound = [];
console.log(`checked_on ${new Date().toISOString().slice(0, 10)}`);
for (const [cond, byCountry] of Object.entries(TILES)) {
  for (const [country, tiles] of Object.entries(byCountry)) {
    for (const [tile, items] of Object.entries(tiles)) {
      for (const item of items) {
        const text = await page(item.src);
        for (const q of item.quotes) {
          let line;
          if (typeof text !== 'string') { line = `MANUAL | ${text.error}`; manual++; }
          else if (text.includes(flat(q))) { line = 'OK'; ok++; }
          else if (squash(text).includes(squash(q))) { line = 'MANUAL | the words are on the page but spacing or punctuation differs: compare by eye'; manual++; }
          else { line = 'NOT FOUND | the quote is not in the page text (page changed, or script-rendered)'; bad++; notFound.push(`${item.id} | ${q}`); }
          console.log(`${cond}.${country}.${tile} ${item.id} | ${line} | ${q.slice(0, 60)}`);
          if (line.startsWith('NOT FOUND')) notFound[notFound.length - 1] += `\n    debug: ${debugNear(item.src, q).replace(/^/, '')}`;
        }
        for (const g of item.foodGroups ?? []) {
          const text = await page(g.src);
          for (const q of [g.quote, ...(g.list ? g.foods : [])]) {
            let line;
            if (typeof text !== 'string') { line = `MANUAL | ${text.error}`; manual++; }
            else if (text.includes(flat(q))) { line = 'OK'; ok++; }
            else if (squash(text).includes(squash(q))) { line = 'MANUAL | the words are on the page but spacing or punctuation differs: compare by eye'; manual++; }
            else { line = 'NOT FOUND | the food line is not in the page text (page changed, or script-rendered)'; bad++; notFound.push(`${item.id} FOOD | ${q}`); }
            console.log(`${cond}.${country}.${tile} ${item.id} FOOD | ${line} | ${q.slice(0, 60)}`);
            if (line.startsWith('NOT FOUND')) notFound[notFound.length - 1] += `\n    debug: ${debugNear(g.src, q)}`;
          }
        }
      }
    }
  }
}
console.log(`\nOK ${ok}, MANUAL ${manual}, NOT FOUND ${bad}`);

if (redirects.length) { console.log('\nREDIRECT WARNINGS (the stored address now shows a different page; every line from these sources is MANUAL until re-sourced):'); for (const r of redirects) console.log(`- ${r}`); }
if (notFound.length) { console.log('\nNOT FOUND SUMMARY (paste this):'); for (const n of notFound) console.log(`- ${n}`); }
