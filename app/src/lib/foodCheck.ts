import type { Country } from './profile';
import { TILES, TILE_SOURCES, UNVERIFIED, visibleGroups, type TileSource } from '../content/conditionTiles';
import { CONDITIONS } from '../content/conditions';

// The honest food check. For one food and the person's own conditions and country, list every official line (already stored in the tile data,
// each with its quote, link and check date) that NAMES this food. A food is "named" only when its words are exactly the words of one food the page
// names (plural or singular, a bracketed preparation word like "(cooked)" ignored). Nothing is inferred from nutrient numbers, no verdict is made.
// The tile data keys conditions by tile id; the picker calls high blood pressure "hypertension".
const TILE_ID: Record<string, string> = { hypertension: 'hbp' };
const LABEL = (tileId: string) => CONDITIONS.find((c) => c.id === tileId)?.label ?? tileId;

const stem = (w: string) => (w.endsWith('ies') && w.length > 4 ? `${w.slice(0, -3)}y` : w.endsWith('oes') ? w.slice(0, -2) : w.endsWith('ses') || w.endsWith('ches') || w.endsWith('shes') ? w.slice(0, -2) : w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w);
const PREP = new Set(['cooked', 'fresh', 'raw', 'canned', 'frozen', 'boiled']);
const words = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(' ').filter((w) => w && !PREP.has(w)).map(stem).sort();
const same = (a: string[], b: string[]) => a.length > 0 && a.length === b.length && a.every((w, i) => w === b[i]);

// "dairy foods (milk, cheese, yogurt)" -> dairy foods, milk, cheese, yogurt. "tomatoes/tomato juice" -> two entries.
export function entriesOf(food: string): string[] {
  const out: string[] = [];
  const inner = [...food.matchAll(/\(([^)]*)\)/g)].map((m) => m[1]);
  const outer = food.replace(/\([^)]*\)/g, ' ');
  for (const part of [outer, ...inner]) for (const e of part.split(/[,/]| or /)) if (e.trim()) out.push(e.trim());
  return out;
}

export type FoodLine = { condition: string; conditionLabel: string; quote: string; foodEntry: string; list: boolean; src: string; source: TileSource };

export function foodCheck(foodName: string, conditionIds: string[], country: Country): FoodLine[] {
  const target = words(foodName);
  const out: FoodLine[] = [];
  const seen = new Set<string>();
  for (const picked of conditionIds) {
    const tileId = TILE_ID[picked] ?? picked;
    const tiles = TILES[tileId]?.[country];
    if (!tiles) continue;
    for (const items of Object.values(tiles)) for (const item of (items ?? []).filter((i) => !UNVERIFIED.includes(i.id))) for (const g of visibleGroups(item)) {
      const hit = g.foods.flatMap(entriesOf).find((e) => same(words(e), target));
      if (!hit) continue;
      const key = `${tileId}|${g.src}|${g.quote}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ condition: tileId, conditionLabel: LABEL(tileId), quote: g.quote, foodEntry: hit, list: !!g.list, src: g.src, source: TILE_SOURCES[g.src] });
    }
  }
  return out;
}
