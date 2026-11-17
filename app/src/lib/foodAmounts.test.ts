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
      expect(['name', 'picked']).toContain(n.how);
      expect(n.forms.length).toBeGreaterThan(0);
      expect(n.default).toBeLessThan(n.forms.length);
      expect(new Set(n.forms.map((f) => f.form)).size).toBe(n.forms.length);
      for (const f of n.forms) { expect(f.servingG).toBeGreaterThan(0); expect(f.cnf.code).toBeGreaterThan(0); expect(f.cnf.name.length).toBeGreaterThan(0); }
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
    for (const n of Object.values(FOOD_NUTRITION)) for (const f of n.forms) for (const c of Object.values(f.cnf.cls)) expect(['analysed', 'usda', 'calculated', 'review']).toContain(c);
  });
  it('maps CNF source codes to the approved classes', () => {
    for (const n of Object.values(FOOD_NUTRITION)) for (const f of n.forms) for (const [k, code] of Object.entries(f.cnf.src)) {
      const cls = f.cnf.cls[k as 'sodiumMg'];
      if (code === 3 || code === 7) expect(cls).toBe('analysed');
      else if (code === 0 || code === 1) expect(cls).toBe('usda');
      else if ([2, 4, 5, 15, 16, 17, 51].includes(code)) expect(cls).toBe('calculated');
      else expect(cls).toBe('review');
    }
  });
  it('offers raw and cooked where both official records exist, and flags the missing form', () => {
    const broc = Object.keys(FOOD_NUTRITION).find((i) => i.endsWith('-broccoli'))!;
    const raw = amountsFor(broc, 'CA', 'raw')!, cooked = amountsFor(broc, 'CA', 'cooked')!;
    expect(raw.forms).toEqual(['raw', 'cooked']);
    expect(raw.form).toBe('raw'); expect(cooked.form).toBe('cooked');
    expect(raw.recordName).not.toBe(cooked.recordName);
    expect(raw.missing).toBeNull();
    const bb = Object.keys(FOOD_NUTRITION).find((i) => i.endsWith('-blackberries'))!;
    const f = amountsFor(bb, 'CA', 'cooked')!; // falls back to the form that exists
    expect(f.form).toBe('raw'); expect(f.missing).toBeNull(); // fruit is not flagged
    const one = Object.keys(FOOD_NUTRITION).find((i) => i.endsWith('-cucumber'))!;
    const b = amountsFor(one, 'CA', 'cooked')!;
    expect(b.form).toBe('raw'); expect(b.missing).toBe('cooked');
    const milk = Object.keys(FOOD_NUTRITION).find((i) => i.endsWith('-whole-milk'))!;
    expect(amountsFor(milk, 'CA')!.missing).toBeNull();
  });
  it('scales per 100 g by serving weight only', () => {
    expect(perServing('potassiumMg', 116, 148)).toBe(172);
    expect(perServing('sodiumMg', 1, 148)).toBe(1.5);
    expect(perServing('proteinG', 3.4, 85)).toBe(2.9);
  });
});
