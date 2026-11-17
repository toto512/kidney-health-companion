import { describe, expect, it } from 'vitest';
import { FOODS, FOOD_GROUPS } from '../content/foods';
import { norm, searchFoods } from './foodSearch';

const names = (q: string, g: Parameters<typeof searchFoods>[2] = 'all') => searchFoods(FOODS, q, g).map((f) => f.name);

describe('food search', () => {
  it('empty query lists the whole group A to Z', () => {
    const r = searchFoods(FOODS, '', 'fruit');
    expect(r.length).toBeGreaterThan(50);
    expect(r.map((f) => f.name)).toEqual([...r.map((f) => f.name)].sort((a, b) => a.localeCompare(b)));
  });
  it('finds by name and plural', () => {
    expect(names('pears', 'fruit')[0]).toBe('Pears');
    expect(names('banana', 'fruit')[0]).toBe('Bananas');
  });
  it('finds by synonym', () => {
    expect(names('whey powder', 'drinks')).toContain('Protein powder');
  });
  it('tolerates a typo', () => {
    expect(names('bannana', 'fruit')[0]).toBe('Bananas');
    expect(names('mozarella')[0]).toBe('Mozzarella');
  });
  it('ignores case, accents and punctuation', () => {
    expect(norm('  Crème, Brûlée! ')).toBe('creme brulee');
    expect(names('PEARS', 'fruit')[0]).toBe('Pears');
  });
  it('needs every typed word to match', () => {
    expect(names('banana mozzarella')).toEqual([]);
  });
  it('unknown food returns nothing, never a guess', () => {
    expect(names('dragonbreath')).toEqual([]);
  });
  it('matches the sub-group name too', () => {
    expect(names('pome', 'fruit')).toContain('Pears');
  });
});

describe('food data', () => {
  it('has unique ids and known groups', () => {
    expect(new Set(FOODS.map((f) => f.id)).size).toBe(FOODS.length);
    for (const f of FOODS) expect(FOOD_GROUPS).toContain(f.group);
  });
  it('fills all 12 groups', () => {
    expect(FOOD_GROUPS).toHaveLength(12);
    for (const g of FOOD_GROUPS) expect(FOODS.some((f) => f.group === g)).toBe(true);
  });
  it('keeps the legacy items and leaves out baby and indigenous foods', () => {
    const all = FOODS.map((f) => f.name.toLowerCase());
    expect(all).toContain('avocado');
    expect(all).toContain('protein powder');
    expect(all.some((n) => n.includes('infant formula') || n.includes('manoomin'))).toBe(false);
  });
});
