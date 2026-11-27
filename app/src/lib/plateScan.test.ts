import { describe, expect, it } from 'vitest';
import { FOOD_NUTRITION } from '../content/foodNutrition';
import { FOODS } from '../content/foods';
import { amountsFor, PLATE_NUTRIENTS } from './foodAmounts';
import { addEntry, groupEntries, MAX_SCAN_ITEMS, plateTotals, portionAmounts, removeEntry, setPortion } from './plateScan';

const withNums = Object.keys(FOOD_NUTRITION);
const [a, b] = withNums;
const noNums = FOODS.find((f) => !FOOD_NUTRITION[f.id])!.id;

describe('plate scan entries', () => {
  it('adds a known food once at Medium, ignores unknown ids and respects the limit', () => {
    const one = addEntry([], a);
    expect(one).toEqual([{ id: a, portion: 'medium' }]);
    expect(addEntry(one, a)).toBe(one);
    expect(addEntry(one, 'nope/nope')).toBe(one);
    let items = one;
    for (const f of FOODS) items = addEntry(items, f.id);
    expect(items.length).toBe(MAX_SCAN_ITEMS);
  });
  it('removes and changes portions', () => {
    const items = addEntry(addEntry([], a), b);
    expect(removeEntry(items, a).map((i) => i.id)).toEqual([b]);
    expect(setPortion(items, a, 'large')[0].portion).toBe('large');
    expect(setPortion(items, a, 'large')[1].portion).toBe('medium');
  });
  it('groups under the 12 sections in the app order and skips empty sections', () => {
    const g = groupEntries(addEntry(addEntry([], noNums), a));
    expect(g.length).toBe(new Set([FOODS.find((f) => f.id === noNums)!.group, FOODS.find((f) => f.id === a)!.group]).size);
    expect(g.flatMap((x) => x.entries).length).toBe(2);
  });
});

describe('plate scan amounts', () => {
  it('scales the official serving by the portion and keeps the source record', () => {
    const med = portionAmounts({ id: a, portion: 'medium' }, 'US')!;
    const small = portionAmounts({ id: a, portion: 'small' }, 'US')!;
    const large = portionAmounts({ id: a, portion: 'large' }, 'US')!;
    expect(med.grams).toBeCloseTo(med.amounts.servingG);
    expect(small.grams).toBeCloseTo(med.grams / 2);
    expect(large.grams).toBeCloseTo(med.grams * 2);
    // Medium equals what the food page shows for the official serving.
    const page = amountsFor(a, 'US')!;
    page.rows.forEach((p) => expect(med.rows.find((r) => r.nutrient === p.nutrient)!.value).toBe(p.value));
    expect(med.amounts.url).toMatch(/^https:\/\/(food-nutrition\.canada\.ca|fdc\.nal\.usda\.gov)\//);
    expect(med.amounts.checkedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
  it('returns null for a food with no official record', () => {
    expect(portionAmounts({ id: noNums, portion: 'medium' }, 'CA')).toBeNull();
  });
  it('hides values the source marks needs review, never adds them to a total', () => {
    let seen = 0;
    for (const id of withNums) {
      const am = amountsFor(id, 'CA');
      if (!am) continue;
      const pa = portionAmounts({ id, portion: 'medium' }, 'CA')!;
      for (const r of am.rows) if (r.cls === 'review') { seen++; expect(pa.rows.find((x) => x.nutrient === r.nutrient)!.value).toBeNull(); }
    }
    expect(seen).toBeGreaterThan(0);
  });
  it('totals only foods with a value and says how many counted, per nutrient', () => {
    const items = addEntry(addEntry(addEntry([], a), b), noNums);
    const totals = plateTotals(items, 'US');
    expect(totals.map((t) => t.nutrient)).toEqual(PLATE_NUTRIENTS);
    for (const t of totals) { expect(t.of).toBe(3); expect(t.counted).toBeLessThanOrEqual(2); expect(t.value === null).toBe(t.counted === 0); }
    expect(totals.find((t) => t.nutrient === 'sodiumMg')!.counted).toBeGreaterThan(0);
    expect(plateTotals(addEntry([], noNums), 'US').every((t) => t.value === null && t.counted === 0)).toBe(true);
    expect(plateTotals([], 'US').every((t) => t.value === null)).toBe(true);
  });
  it('adds the new nutrients from the USDA record when the Canadian record lacks them, and labels them', () => {
    const pa = portionAmounts({ id: a, portion: 'medium' }, 'CA')!;
    const e = pa.rows.find((r) => r.nutrient === 'energyKcal')!;
    expect(pa.rows.length).toBe(PLATE_NUTRIENTS.length);
    if (e.value !== null) { expect(e.from).toBe('other'); expect(pa.amounts.other?.source).toBe('usda'); }
    expect(pa.rows.find((r) => r.nutrient === 'sodiumMg')!.from).toBe('main');
  });
  it('gaps: every nutrient has a value for most foods with a record, and none is invented', () => {
    for (const k of PLATE_NUTRIENTS) {
      const n = withNums.filter((id) => portionAmounts({ id, portion: 'medium' }, 'US')!.rows.find((r) => r.nutrient === k)!.value !== null).length;
      expect(n).toBeGreaterThan(withNums.length * 0.5);
    }
  });
});
