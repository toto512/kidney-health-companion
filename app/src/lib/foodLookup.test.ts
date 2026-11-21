import { describe, expect, it } from 'vitest';
import { allow, cleanQuery, corsOrigin, parseHits, subFromJwt, PER_PERSON_LIMIT, WINDOW_MS } from '../../../supabase/functions/food-search/logic';

const jwt = (payload: object) => 'x.' + btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') + '.y';

describe('food-search logic', () => {
  it('cleans the search term', () => {
    expect(cleanQuery('  Canadian   bacon ')).toBe('Canadian bacon');
    expect(cleanQuery("Mac & cheese, 2% (low fat)")).toBe("Mac & cheese, 2% (low fat)");
    expect(cleanQuery('a')).toBeNull();
    expect(cleanQuery('x'.repeat(81))).toBeNull();
    expect(cleanQuery(5)).toBeNull();
    expect(cleanQuery('cheese<script>')).toBe('cheese script');
  });
  it('reads the person from the token, never from the body', () => {
    expect(subFromJwt(jwt({ sub: 'abc' }))).toBe('abc');
    expect(subFromJwt('nope')).toBeNull();
    expect(subFromJwt(jwt({}))).toBeNull();
  });
  it('gives each person a small hourly share of the shared USDA limit', () => {
    const hits = new Map<string, number[]>();
    for (let i = 0; i < PER_PERSON_LIMIT; i++) expect(allow(hits, 'u1', 1000 + i)).toBe(true);
    expect(allow(hits, 'u1', 2000)).toBe(false);
    expect(allow(hits, 'u2', 2000)).toBe(true);
    expect(allow(hits, 'u1', 1000 + WINDOW_MS + 1)).toBe(true);
    expect(PER_PERSON_LIMIT).toBeLessThan(1000);
  });
  it('keeps the same origin rules as delete-account', () => {
    expect(corsOrigin('https://health.carciente.ca', undefined)).toBe('https://health.carciente.ca');
    expect(corsOrigin('https://evil.example', undefined)).toBeNull();
  });
  it('parses both field spellings, keeps only Foundation and SR Legacy, and caps the list', () => {
    const json = { foods: [
      { fdcId: 1, description: 'Canadian bacon, unprepared', dataType: 'SR Legacy', foodNutrients: [{ nutrientNumber: '307', value: 1200 }, { nutrientNumber: '306', value: 400 }, { nutrientNumber: '305', value: 250 }, { nutrientNumber: '203', value: 20.5 }, { nutrientNumber: '208', value: 100 }] },
      { fdcId: 2, description: 'Ham', dataType: 'Foundation', foodNutrients: [{ number: 307, amount: 900 }, { number: 203, amount: 18 }] },
      { fdcId: 3, description: 'BRAND BACON', dataType: 'Branded', foodNutrients: [] },
      { fdcId: 'x', description: 'bad', dataType: 'SR Legacy' },
    ] };
    const hits = parseHits(json);
    expect(hits.map((h) => h.fdcId)).toEqual([1, 2]);
    expect(hits[0].per100).toEqual({ sodiumMg: 1200, potassiumMg: 400, phosphorusMg: 250, proteinG: 20.5 });
    expect(hits[1].per100).toEqual({ sodiumMg: 900, proteinG: 18 });
    expect(parseHits({ foods: Array.from({ length: 30 }, (_, i) => ({ fdcId: i, description: 'f', dataType: 'SR Legacy' })) }, 10)).toHaveLength(10);
    expect(parseHits(null)).toEqual([]);
  });
});
