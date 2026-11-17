import { describe, expect, it } from 'vitest';
import { FOODS, FOOD_CATEGORIES } from '../content/foods';
import { norm, searchFoods } from './foodSearch';

const ids = (q: string, c: Parameters<typeof searchFoods>[2] = 'all') => searchFoods(FOODS, q, c).map((f) => f.id);

describe('food search', () => {
  it('empty query lists everything A to Z', () => {
    const r = searchFoods(FOODS, '');
    expect(r).toHaveLength(FOODS.length);
    expect(r.map((f) => f.name)).toEqual([...r.map((f) => f.name)].sort((a, b) => a.localeCompare(b)));
  });
  it('finds by name, synonym and plural', () => {
    expect(ids('banana')[0]).toBe('banana');
    expect(ids('shrimp')[0]).toBe('shellfish');
    expect(ids('potatoes')[0]).toBe('potato');
  });
  it('tolerates a typo', () => {
    expect(ids('bannana')[0]).toBe('banana');
    expect(ids('mozarella')[0]).toBe('mozzarella-part-skim');
  });
  it('ignores case, accents and punctuation', () => {
    expect(norm('  Crème, Brûlée! ')).toBe('creme brulee');
    expect(ids('BANANA')[0]).toBe('banana');
  });
  it('needs every typed word to match', () => {
    expect(ids('white rice')[0]).toBe('white-rice');
    expect(ids('banana rice')).toEqual([]);
  });
  it('unknown food returns nothing, never a guess', () => {
    expect(ids('asparagus')).toEqual([]);
  });
  it('filters by category', () => {
    expect(ids('', 'fruit').sort()).toEqual(['apple', 'avocado', 'banana']);
  });
});

describe('food data', () => {
  it('has unique ids and known categories', () => {
    expect(new Set(FOODS.map((f) => f.id)).size).toBe(FOODS.length);
    for (const f of FOODS) expect(FOOD_CATEGORIES).toContain(f.category);
  });
  it('carries no amount without a source link and a check date', () => {
    for (const f of FOODS) if (f.amounts) {
      expect(f.amounts.url).toMatch(/^https:\/\//);
      expect(f.amounts.checkedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});
