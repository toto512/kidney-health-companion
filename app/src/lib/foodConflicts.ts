import { tileItems, visibleGroups, type TileKey } from '../content/conditionTiles';
import type { Country } from './profile';

// People can have several conditions, and one official page may say "avoid" for a food where another says "limit".
// Rule (James, 2026-11-21): when any of the person's conditions is stricter about a food, say so and tell them to ask their care team.
// Only foods that an official page names (the food lists inside the sourced groups) are compared; we add no advice of our own.
const RANK: Partial<Record<TileKey, number>> = { moderate: 1, avoid: 2 };

// "Bananas", "banana" and "Bananas (cooked)" are the same food for matching.
export const foodKey = (f: string): string => f.toLowerCase().replace(/\([^)]*\)/g, ' ').replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(Boolean).map((w) => (w.length > 3 && w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w)).join(' ');

/** Foods one condition names under one tile (avoid or moderate), as match keys, for the person's country. */
export function foodsIn(condition: string, country: Country, tile: TileKey): Set<string> {
  const out = new Set<string>();
  for (const item of tileItems(condition, country, tile)) for (const g of visibleGroups(item)) for (const f of g.foods) out.add(foodKey(f));
  return out;
}

export type Stricter = { food: string; conditions: string[] };

/** Foods from `foods` (a group shown under `tile` for `condition`) that another picked condition puts under a stricter tile. */
export function stricterElsewhere(foods: string[], tile: TileKey, condition: string, others: { id: string; label: string }[], country: Country): Stricter[] {
  const mine = RANK[tile] ?? 0;
  const found: Stricter[] = [];
  for (const food of foods) {
    const key = foodKey(food);
    if (!key) continue;
    const labels = others.filter((o) => o.id !== condition).filter((o) => (Object.keys(RANK) as TileKey[]).some((t) => (RANK[t] ?? 0) > mine && foodsIn(o.id, country, t).has(key))).map((o) => o.label);
    if (labels.length) found.push({ food, conditions: labels });
  }
  return found;
}
