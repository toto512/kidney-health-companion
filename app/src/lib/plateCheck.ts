import { foodCheck, type FoodLine } from './foodCheck';
import type { Country } from './profile';

// Plate photo check. The photo only helps the person pick names. Every flag comes from the same sourced official lines the single-food check uses,
// for the foods the person confirmed. No weights, no "ok to eat" label: a food no page names is "no official guidance", never "fine".
// Strictest wins across conditions: any official "avoid" line makes the flag avoid; otherwise any limit wording makes it limit.
export type PlateFlag = 'avoid' | 'limit' | 'none';
export type PlateRow = { name: string; flag: PlateFlag; lines: FoodLine[] };

export const MAX_PLATE_ITEMS = 12;

export function flagFor(lines: FoodLine[]): PlateFlag {
  if (lines.some((l) => l.tile === 'avoid')) return 'avoid';
  if (lines.some((l) => l.tile === 'moderate')) return 'limit';
  return 'none';
}

const RANK: Record<PlateFlag, number> = { none: 0, limit: 1, avoid: 2 };
export const worstFlag = (rows: PlateRow[]): PlateFlag => rows.reduce<PlateFlag>((a, r) => (RANK[r.flag] > RANK[a] ? r.flag : a), 'none');

/** Add a food name once (case-insensitive), up to the limit. Returns the same array when nothing changes. */
export function addItem(items: string[], name: string): string[] {
  const n = name.trim();
  if (!n || items.length >= MAX_PLATE_ITEMS || items.some((i) => i.toLowerCase() === n.toLowerCase())) return items;
  return [...items, n];
}
export const removeItem = (items: string[], name: string): string[] => items.filter((i) => i !== name);

export function plateCheck(items: string[], conditionIds: string[], country: Country): PlateRow[] {
  return items.map((name) => {
    const lines = foodCheck(name, conditionIds, country).filter((l) => l.tile === 'avoid' || l.tile === 'moderate');
    return { name, flag: flagFor(lines), lines };
  });
}
