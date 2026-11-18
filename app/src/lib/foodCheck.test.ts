import { describe, expect, it } from 'vitest';
import { entriesOf, foodCheck } from './foodCheck';

describe('food check: only official lines that name the food', () => {
  it('bananas are named for US kidney disease, with the official list intro and source', () => {
    const r = foodCheck('Banana', ['ckd'], 'US');
    expect(r.length).toBeGreaterThan(0);
    expect(r[0].quote).toMatch(/potassium/);
    expect(r[0].source.url).toMatch(/^https:\/\/www\.niddk\.nih\.gov/);
    expect(r[0].source.checkedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
  it('milk matches through the bracket list, cheese too', () => {
    expect(foodCheck('Milk', ['ckd'], 'US').some((l) => l.foodEntry === 'milk')).toBe(true);
    expect(foodCheck('Cheese', ['ckd'], 'US').length).toBeGreaterThan(0);
  });
  it('a different food does not match by a shared word', () => {
    expect(foodCheck('Orange bell peppers', ['ckd'], 'US')).toEqual([]);
    expect(foodCheck('Potatoes', ['ckd'], 'US').every((l) => l.foodEntry !== 'sweet potatoes')).toBe(true);
    expect(foodCheck('Zucchini', ['ckd', 'gout', 'hypertension'], 'US')).toEqual([]);
  });
  it('only the person\'s conditions and country count; hypertension maps to the high blood pressure tiles', () => {
    expect(foodCheck('Bananas', ['gout'], 'US')).toEqual([]);
    expect(foodCheck('Bananas', ['ckd'], 'GB')).toEqual([]);
    expect(foodCheck('Shrimp', ['gout'], 'US')[0].quote).toMatch(/Avoiding/);
    expect(foodCheck('Shrimp', ['gout'], 'CA')).toEqual([]);
    expect(foodCheck('Seafood', ['gout'], 'CA').length).toBe(1);
    expect(foodCheck('Seafood', ['hypertension'], 'CA')).toEqual([]);
  });
  it('entriesOf splits slashes, commas and brackets', () => {
    expect(entriesOf('dairy foods (milk, cheese, yogurt)')).toEqual(['dairy foods', 'milk', 'cheese', 'yogurt']);
    expect(entriesOf('tomatoes/tomato juice/tomato sauce')).toEqual(['tomatoes', 'tomato juice', 'tomato sauce']);
  });
});
