import { FOOD_GROUPS, FOODS, type Food, type FoodGroup } from '../content/foods';
import type { Nutrient } from '../content/foodNutrition';
import { amountsFor, NUTRIENTS, perServing, type ResolvedAmounts } from './foodAmounts';

// Plate scan with portions. The photo only helps the person remember the plate. Nothing is read from the picture: the person picks each food
// and a portion. A portion is a multiple of the serving the official table publishes for that food (Canadian Nutrient File or USDA FoodData Central),
// so the amounts are the table's own per-100 g values scaled by weight. Values the source marks "needs review" are hidden and never added to a total.
export type PortionKey = 'small' | 'medium' | 'large';
export const PORTIONS: { key: PortionKey; mult: number }[] = [
  { key: 'small', mult: 0.5 },
  { key: 'medium', mult: 1 },
  { key: 'large', mult: 2 },
];
export const DEFAULT_PORTION: PortionKey = 'medium';
export const MAX_SCAN_ITEMS = 12;
export type ScanEntry = { id: string; portion: PortionKey };

const multOf = (p: PortionKey) => PORTIONS.find((x) => x.key === p)!.mult;
const byId = new Map(FOODS.map((f) => [f.id, f] as const));
export const foodById = (id: string): Food | undefined => byId.get(id);

export function addEntry(items: ScanEntry[], id: string): ScanEntry[] {
  if (!byId.has(id) || items.length >= MAX_SCAN_ITEMS || items.some((i) => i.id === id)) return items;
  return [...items, { id, portion: DEFAULT_PORTION }];
}
export const removeEntry = (items: ScanEntry[], id: string): ScanEntry[] => items.filter((i) => i.id !== id);
export const setPortion = (items: ScanEntry[], id: string, portion: PortionKey): ScanEntry[] => items.map((i) => (i.id === id ? { ...i, portion } : i));

/** Entries grouped under the 12 food sections, sections in the app's usual order, empty sections left out. */
export function groupEntries(items: ScanEntry[]): { group: FoodGroup; entries: ScanEntry[] }[] {
  return FOOD_GROUPS.map((group) => ({ group, entries: items.filter((i) => byId.get(i.id)?.group === group) })).filter((g) => g.entries.length > 0);
}

export type PortionRow = { nutrient: Nutrient; value: number | null; raw: number | null };
export type PortionAmounts = { amounts: ResolvedAmounts; grams: number; rows: PortionRow[] };

/** Amounts for one portion of a food, or null when no official table record exists. Needs-review values come back null. */
export function portionAmounts(entry: ScanEntry, country: string | null | undefined, lang = 'en'): PortionAmounts | null {
  const amounts = amountsFor(entry.id, country, null, lang);
  if (!amounts) return null;
  const grams = amounts.servingG * multOf(entry.portion);
  const rows = NUTRIENTS.map((nutrient) => {
    const per100 = amounts.per100[nutrient];
    const cls = amounts.rows.find((r) => r.nutrient === nutrient)?.cls ?? null;
    if (per100 === undefined || cls === 'review') return { nutrient, value: null, raw: null };
    return { nutrient, value: perServing(nutrient, per100, grams), raw: (per100 * grams) / 100 };
  });
  return { amounts, grams, rows };
}

export type PlateTotal = { nutrient: Nutrient; value: number; counted: number; of: number };
/** Plate total per nutrient, summing only foods with a published, not-under-review value. A nutrient nobody has a value for is left out. */
export function plateTotals(items: ScanEntry[], country: string | null | undefined, lang = 'en'): PlateTotal[] {
  const all = items.map((i) => portionAmounts(i, country, lang));
  return NUTRIENTS.flatMap((nutrient) => {
    const raws = all.map((a) => a?.rows.find((r) => r.nutrient === nutrient)?.raw ?? null).filter((r): r is number => r !== null);
    if (raws.length === 0) return [];
    const sum = raws.reduce((a, b) => a + b, 0);
    return [{ nutrient, value: nutrient === 'proteinG' || sum < 10 ? Math.round(sum * 10) / 10 : Math.round(sum), counted: raws.length, of: items.length }];
  });
}
