// Checks that every quote in src/content/conditionTiles.ts appears word for word on its official page, and prints one line per quote.
// Run from the app folder on a machine that can reach the sites:  node --experimental-strip-types scripts/verify-condition-tiles.mjs
// Reads only the public tile content (no user data). An item should stay only while all of its lines say OK.
// MANUAL means the page could not be read by a script (blocked or script-rendered): open the page and look for the quote.
import { TILES, TILE_SOURCES } from '../src/content/conditionTiles.ts';

const flat = (s) => s.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&').replace(/&#0?39;|&apos;|&rsquo;|’/g, "'").replace(/&quot;|“|”/g, '"')
  .replace(/&ndash;|&mdash;|–|—/g, '-').replace(/&frac12;/g, '½').replace(/\s+/g, ' ').trim().toLowerCase();

const pages = new Map();
async function page(id) {
  if (pages.has(id)) return pages.get(id);
  let res;
  try {
    const r = await fetch(TILE_SOURCES[id].url, { headers: { 'user-agent': 'health-companion-tile-check/1.0' }, redirect: 'follow' });
    res = r.ok ? flat(await r.text()) : `HTTP ${r.status}`;
    if (!r.ok) res = { error: res };
  } catch (e) {
    res = { error: String(e.message ?? e) };
  }
  pages.set(id, res);
  return res;
}

let ok = 0, manual = 0, bad = 0;
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
          else { line = 'NOT FOUND | the quote is not in the page text (page changed, or script-rendered)'; bad++; }
          console.log(`${cond}.${country}.${tile} ${item.id} | ${line} | ${q.slice(0, 60)}`);
        }
        for (const g of item.foodGroups ?? []) {
          const text = await page(g.src);
          for (const q of [g.quote, ...(g.list ? g.foods : [])]) {
            let line;
            if (typeof text !== 'string') { line = `MANUAL | ${text.error}`; manual++; }
            else if (text.includes(flat(q))) { line = 'OK'; ok++; }
            else { line = 'NOT FOUND | the food line is not in the page text (page changed, or script-rendered)'; bad++; }
            console.log(`${cond}.${country}.${tile} ${item.id} FOOD | ${line} | ${q.slice(0, 60)}`);
          }
        }
      }
    }
  }
}
console.log(`\nOK ${ok}, MANUAL ${manual}, NOT FOUND ${bad}`);
