import { describe, expect, it } from 'vitest';
import { FOOD_NUTRITION, NUTRITION_CHECKED_ON } from '../content/foodNutrition';
import { FOODS } from '../content/foods';
import { amountsFor, cnfUrl, lookupLinks, perServing, reviewReason, usdaUrl } from './foodAmounts';

const ids = new Set(FOODS.map((f) => f.id));
const pears = Object.keys(FOOD_NUTRITION).find((i) => i.endsWith('-pears'))!;

describe('food amounts', () => {
  it('only holds numbers for foods that exist, with a match recorded', () => {
    for (const [id, n] of Object.entries(FOOD_NUTRITION)) {
      expect(ids.has(id)).toBe(true);
      expect(['name', 'picked', 'usda']).toContain(n.how);
      expect(n.forms.length).toBeGreaterThan(0);
      expect(n.default).toBeLessThan(n.forms.length);
      expect(new Set(n.forms.map((f) => f.form)).size).toBe(n.forms.length);
      for (const f of n.forms) { expect(f.servingG).toBeGreaterThan(0); expect(f.cnf || f.usda).toBeTruthy(); if (f.cnf) { expect(f.cnf.code).toBeGreaterThan(0); expect(f.cnf.name.length).toBeGreaterThan(0); } }
    }
    expect(Object.keys(FOOD_NUTRITION).length).toBeGreaterThan(90);
  });
  it('has a check date and no unofficial host', () => {
    expect(NUTRITION_CHECKED_ON).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    for (const id of Object.keys(FOOD_NUTRITION)) for (const c of ['CA', 'US']) {
      const a = amountsFor(id, c)!;
      expect(a.url).toMatch(/^https:\/\/(food-nutrition\.canada\.ca\/cnf-fce\/serving-portion\?id=\d+|fdc\.nal\.usda\.gov\/food-details\/\d+\/nutrients)$/);
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
    for (const n of Object.values(FOOD_NUTRITION)) for (const f of n.forms) for (const c of Object.values(f.cnf?.cls ?? {})) expect(['analysed', 'usda', 'calculated', 'review']).toContain(c);
  });
  it('maps CNF source codes to the approved classes', () => {
    for (const n of Object.values(FOOD_NUTRITION)) for (const f of n.forms) for (const [k, code] of Object.entries(f.cnf?.src ?? {})) {
      const cls = f.cnf!.cls[k as 'sodiumMg'];
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
  it('builds per-food links and explains review values', () => {
    expect(cnfUrl(1731, 'en')).toBe('https://food-nutrition.canada.ca/cnf-fce/serving-portion?id=1731');
    expect(cnfUrl(1731, 'fr')).toBe('https://aliments-nutrition.canada.ca/cnf-fce/serving-portion?id=1731');
    expect(usdaUrl(169118)).toBe('https://fdc.nal.usda.gov/food-details/169118/nutrients');
    expect([12, 14, 10, 81, 83, 6, null].map(reviewReason)).toEqual(['zero', 'prov', 'lit', 'intl', 'intl', 'other', 'other']);
  });
  it('scales per 100 g by serving weight only', () => {
    expect(perServing('potassiumMg', 116, 148)).toBe(172);
    expect(perServing('sodiumMg', 1, 148)).toBe(1.5);
    expect(perServing('proteinG', 3.4, 85)).toBe(2.9);
  });
});

describe('variant note', () => {
  it('flags foods where one common variant was picked, and not exact matches', () => {
    expect(amountsFor('grains-bread/true-cereal-grains-rice', 'US')?.variant).toBe(true);
    expect(amountsFor('fruit/berries-blackberries', 'US')?.variant ?? false).toBe(false);
  });
  it('every variant food shows its official record name', () => {
    for (const [id, n] of Object.entries(FOOD_NUTRITION)) if (n.variant) expect(amountsFor(id, 'US')!.recordName.length).toBeGreaterThan(0);
  });
});

describe('USDA-only foods', () => {
  it('read from USDA for every country and name the file, record and a 3 oz style serving for meats', () => {
    const a = amountsFor('fish-seafood/finfish-catfish', 'CA')!;
    expect(a.source).toBe('usda');
    expect(a.file).toMatch(/SR Legacy|Foundation/);
    expect(a.url).toMatch(/^https:\/\/fdc\.nal\.usda\.gov\/food-details\/\d+\/nutrients$/);
    expect(a.serving).toMatch(/^3 oz/);
    expect(a.variant).toBe(true);
  });
  it('never uses a whole roast, rack or liter as a serving', () => {
    for (const [id, n] of Object.entries(FOOD_NUTRITION)) if (n.how === 'usda' && /^(meat-poultry|fish-seafood)\//.test(id)) for (const f of n.forms) expect(f.servingG, id).toBeLessThanOrEqual(130);
  });
});

describe('look-up links', () => {
  it('always offers the USDA search with the food name, and the national source for CA and GB', () => {
    expect(lookupLinks('Canadian bacon', 'US').map((l) => l.kind)).toEqual(['usda']);
    expect(lookupLinks('Canadian bacon', 'US')[0].url).toBe('https://fdc.nal.usda.gov/food-search/?query=Canadian%20bacon');
    expect(lookupLinks('Pears', 'CA').map((l) => l.kind)).toEqual(['cnf', 'usda']);
    expect(lookupLinks('Pears', 'CA', 'fr')[0].url).toMatch(/^https:\/\/aliments-nutrition\.canada\.ca\//);
    expect(lookupLinks('Pears', 'GB').map((l) => l.kind)).toEqual(['cofid', 'usda']);
    expect(lookupLinks('Pears', null).map((l) => l.kind)).toEqual(['usda']);
  });
});
