import type { Food, FoodGroup } from '../content/foods';

/** Lower case, no accents or punctuation, single spaces. */
export function norm(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function distance(a: string, b: string): number {
  if (a === b) return 0;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = tmp;
    }
  }
  return prev[b.length];
}

// Score one query word against one word of a food name or synonym: 3 exact (or plural), 2 prefix or close spelling (1 slip, 2 for long words), 0 none.
function wordScore(q: string, w: string): number {
  if (q === w || q + 's' === w || q === w + 's' || q + 'es' === w || q === w + 'es') return 3;
  if (q.length >= 2 && w.startsWith(q)) return 2;
  if (q.length >= 4) {
    const allow = q.length >= 8 ? 2 : 1;
    if (distance(q, w) <= allow || (w.endsWith('s') && distance(q, w.slice(0, -1)) <= allow)) return 2;
    // A slip inside a longer word's start ("bannana" for "bananas").
    if (w.length > q.length && distance(q, w.slice(0, q.length)) <= allow) return 1;
  }
  return 0;
}

function foodScore(words: string[], f: Food): number {
  const phrases = [f.name, f.sub, ...(f.synonyms ?? [])].map(norm);
  let best = 0;
  for (const p of phrases) {
    const pw = p.split(' ');
    let total = 0;
    for (const q of words) {
      const s = Math.max(...pw.map((w) => wordScore(q, w)));
      if (s === 0) { total = 0; break; }
      total += s;
    }
    best = Math.max(best, total);
  }
  return best;
}

/** Foods matching every typed word (typos tolerated), best first, then A to Z (the sub-group name also matches). An empty query returns the whole list A to Z. */
export function searchFoods(foods: Food[], query: string, group: FoodGroup | 'all' = 'all'): Food[] {
  const pool = group === 'all' ? foods : foods.filter((f) => f.group === group);
  const words = norm(query).split(' ').filter(Boolean);
  const byName = (a: Food, b: Food) => a.name.localeCompare(b.name);
  if (words.length === 0) return [...pool].sort(byName);
  return pool
    .map((f) => ({ f, s: foodScore(words, f) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || a.f.name.length - b.f.name.length || byName(a.f, b.f))
    .map((x) => x.f);
}

/** Exact search for the all-foods bar: foods whose name contains every typed word (case, accents and punctuation ignored). Names only, no typos, synonyms or group names. Names starting with the text come first, then A to Z. */
export function searchFoodNames(foods: Food[], query: string): Food[] {
  const words = norm(query).split(' ').filter(Boolean);
  if (words.length === 0) return [];
  const phrase = words.join(' ');
  const rank = (f: Food) => {
    const n = norm(f.name);
    return n.startsWith(phrase) ? 0 : n.split(' ').some((w) => w.startsWith(phrase)) ? 1 : 2;
  };
  return foods
    .filter((f) => { const n = norm(f.name); return words.every((w) => n.includes(w)); })
    .sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));
}
