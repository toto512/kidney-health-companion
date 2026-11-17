import { describe, expect, it } from 'vitest';
import { FOOD_NUTRITION, NUTRITION_CHECKED_ON } from '../content/foodNutrition';
import { FOODS } from '../content/foods';
import { amountsFor, perServing } from './foodAmounts';

const ids = new Set(FOODS.map((f) => f.id));
const pears = Object.keys(FOOD_NUTRITION).find((i) => i.endsWith('-pears'))!;

describe('food amounts', () => {
  it('only holds numbers for foods that exist, with a match recorded', () => {
    for (const [id, n] of Object.entries(FOOD_NUTRITION)) {
      expect(ids.has(id)).toBe(true);
      expect(n.cnf.code).toBeGreaterThan(0);
      expect(n.cnf.name.length).toBeGreaterThan(0);
      expect(['name', 'picked']).toContain(n.how);
      expect(n.servingG).toBeGreaterThan(0);
    }
    expect(Object.keys(FOOD_NUTRITION).length).toBeGreaterThan(90);
  });
  it('has a check date and no unofficial host', () => {
    expect(NUTRITION_CHECKED_ON).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    for (const id of Object.keys(FOOD_NUTRITION)) for (const c of ['CA', 'US']) {
      const a = amountsFor(id, c)!;
      expect(a.url).toMatch(/^https:\/\/(www\.canada\.ca|fdc\.nal\.usda\.gov)\//);
      expect(a.url).not.toContain('inonde.io');
      expect(a.checkedOn).toBe(NUTRITION_CHECKED_ON);
    }
  });
  it('returns null for a food without a match', () => {
    expect(amountsFor('no/such-food', 'CA')).toBeNull();
    const unmatched = FOODS.find((f) => !FOOD_NUTRITION[f.id])!;
    expect(amountsFor(unmatched.id, 'CA')).toBeNull();
  });
  it('keeps Canadian users on the Canadian Nutrient File, others on USDA', () => {
    expect(amountsFor(pears, 'CA')!.source).toBe('cnf');
    expect(amountsFor(pears, 'US')!.source).toBe('usda');
    expect(amountsFor(pears, null)!.source).toBe('usda');
    expect(amountsFor(pears, 'CA')!.rows.every((r) => r.cls !== null || r.value === null)).toBe(true);
    expect(amountsFor(pears, 'US')!.rows.every((r) => r.cls === null)).toBe(true);
  });
  it('labels classes only with the approved four', () => {
    for (const n of Object.values(FOOD_NUTRITION)) for (const c of Object.values(n.cnf.cls)) expect(['analysed', 'usda', 'calculated', 'review']).toContain(c);
  });
  it('maps CNF source codes to the approved classes', () => {
    for (const n of Object.values(FOOD_NUTRITION)) for (const [k, code] of Object.entries(n.cnf.src)) {
      const cls = n.cnf.cls[k as 'sodiumMg'];
      if (code === 3 || code === 7) expect(cls).toBe('analysed');
      else if (code === 0 || code === 1) expect(cls).toBe('usda');
      else if ([2, 4, 5, 15, 16, 17, 51].includes(code)) expect(cls).toBe('calculated');
      else expect(cls).toBe('review');
    }
  });
  it('scales per 100 g by serving weight only', () => {
    expect(perServing('potassiumMg', 116, 148)).toBe(172);
    expect(perServing('sodiumMg', 1, 148)).toBe(1.5);
    expect(perServing('proteinG', 3.4, 85)).toBe(2.9);
  });
});
