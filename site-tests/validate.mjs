// Static checks that need no browser: JSON validity, manifest fields, food schema.
import { readFileSync } from 'node:fs';
const fail = [];
const json = (p) => { try { return JSON.parse(readFileSync(new URL(`../${p}`, import.meta.url), 'utf8')); } catch (e) { fail.push(`${p}: ${e.message}`); return null; } };

const foods = json('data/foods.json');
const list = Array.isArray(foods) ? foods : foods?.foods;
if (!Array.isArray(list) || !list.length) fail.push('data/foods.json: expected a non-empty array');
else {
  const ids = new Set();
  for (const f of list) {
    for (const k of ['id', 'name', 'category', 'synonyms', 'portion']) if (!(k in f)) fail.push(`foods: ${f.id ?? '?'} missing ${k}`);
    if (ids.has(f.id)) fail.push(`foods: duplicate id ${f.id}`);
    ids.add(f.id);
  }
}
const m = json('manifest.webmanifest');
if (m) for (const k of ['name', 'start_url', 'display', 'icons']) if (!(k in m)) fail.push(`manifest: missing ${k}`);

if (fail.length) { console.error(fail.join('\n')); process.exit(1); }
console.log(`ok: ${list.length} foods, manifest valid`);
