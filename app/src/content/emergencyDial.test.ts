import { describe, expect, it } from 'vitest';
import { LISTED_EMERGENCY } from './emergency';
import { dialTargets, emergencyDialFor } from './emergencyDial';

const texts = (c: string) => emergencyDialFor(c).map((t) => t.text);

describe('emergency call buttons', () => {
  it('single numbers', () => {
    expect(texts('US')).toEqual(['Call 9-1-1 now']);
    expect(emergencyDialFor('US')[0].tel).toBe('tel:911');
    expect(texts('CA')).toEqual(['Call 9-1-1 now']);
    expect(texts('GB')).toEqual(['Call 999 now']);
    expect(texts('DE')).toEqual(['Call 112 now']);
  });
  it('several numbers, no police or fire only buttons', () => {
    expect(texts('AT')).toEqual(['Call 144 now (ambulance)', 'Call 112 now']);
    expect(texts('FR')).toEqual(['Call 15 now (ambulance)', 'Call 112 now']);
    expect(texts('PL')).toEqual(['Call 999 now (ambulance)', 'Call 112 now (general emergency)']);
    expect(texts('JP')).toEqual(['Call 119 now (ambulance or fire)']);
    expect(texts('IL')).toEqual(['Call 101 now (ambulance)']);
    expect(texts('IE')).toEqual(['Call 112 now', 'Call 999 now']);
    expect(texts('IN')).toEqual(['Call 112 now', 'Call 108 now (ambulance)']);
  });
  it('fallback countries and no country get no buttons', () => {
    expect(emergencyDialFor('RS')).toEqual([]);
    expect(emergencyDialFor(null)).toEqual([]);
    expect(emergencyDialFor(undefined)).toEqual([]);
  });
  it('every listed country has at least one button and only digits in tel', () => {
    for (const [code, e] of Object.entries(LISTED_EMERGENCY)) {
      const t = dialTargets(e.number, e.tokens);
      expect(t.length, code).toBeGreaterThan(0);
      for (const x of t) expect(x.tel, code).toMatch(/^tel:[0-9]{2,4}$/);
    }
  });
});
