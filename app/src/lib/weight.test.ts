import { describe, expect, it } from 'vitest';
import { CHECK_JUMP, formatWeight, fromKg, jumpsFromLast, parseWeight, TENTH_OPTIONS, toKg, WEIGHT_LIMITS, wholeOptions } from './weight';
import { changeInWindow, weightScale, weightSpan, windowWeights, type WeightRow } from './weightChart';

describe('unit conversion', () => {
  it('stores kilograms with 2 decimals and a pound weight comes back the same', () => {
    expect(toKg(154, 'lb')).toBe(69.85);
    expect(fromKg(69.85, 'lb')).toBe(154);
    for (const lb of [45, 99.9, 154.0, 200.5, 331.7, 660.9]) expect(fromKg(toKg(lb, 'lb'), 'lb')).toBe(lb);
    for (const kg of [20, 70.1, 99.9, 300.9]) expect(fromKg(toKg(kg, 'kg'), 'kg')).toBe(kg);
  });
  it('shows one decimal', () => {
    expect(formatWeight(70, 'kg', 'en')).toBe('70.0');
    expect(formatWeight(70, 'lb', 'en')).toBe('154.3');
  });
});

describe('parseWeight', () => {
  it('builds the value from the whole number and the tenth', () => {
    expect(parseWeight('kg', '70', '5')).toEqual({ ok: true, value: { kg: 70.5, unit: 'kg' } });
    expect(parseWeight('lb', '154', '')).toEqual({ ok: true, value: { kg: 69.85, unit: 'lb' } });
  });
  it('asks for the whole number first', () => {
    for (const w of ['', ' ', 'abc', '1234', '-5', '7.5']) expect(parseWeight('kg', w, '0'), w).toEqual({ ok: false, error: 'missing' });
  });
  it('accepts the limits and refuses outside them, in each unit', () => {
    for (const u of ['kg', 'lb'] as const) {
      const { min, max } = WEIGHT_LIMITS[u];
      expect(parseWeight(u, String(min), '0').ok).toBe(true);
      expect(parseWeight(u, String(max), '9').ok).toBe(true);
      expect(parseWeight(u, String(min - 1), '9')).toEqual({ ok: false, error: 'range' });
      expect(parseWeight(u, String(max + 1), '0')).toEqual({ ok: false, error: 'range' });
    }
    expect(parseWeight('kg', '70', '10')).toEqual({ ok: false, error: 'range' });
  });
  it('everything the app accepts fits inside the database limit', () => {
    expect(toKg(WEIGHT_LIMITS.lb.max + 0.9, 'lb')).toBeLessThanOrEqual(500);
    expect(toKg(WEIGHT_LIMITS.kg.max + 0.9, 'kg')).toBeLessThanOrEqual(500);
    expect(toKg(WEIGHT_LIMITS.lb.min, 'lb')).toBeGreaterThanOrEqual(10);
  });
  it('offers every whole number in range and the tenths 0 to 9', () => {
    expect(wholeOptions('kg')).toHaveLength(WEIGHT_LIMITS.kg.max - WEIGHT_LIMITS.kg.min + 1);
    expect(wholeOptions('lb')[0].value).toBe('45');
    expect(TENTH_OPTIONS.map((o) => o.value).join('')).toBe('0123456789');
  });
});

describe('typing-slip check', () => {
  it('flags a jump of 10 percent or more from the last weight, and nothing without a last weight', () => {
    expect(CHECK_JUMP).toBe(0.1);
    expect(jumpsFromLast(77, 70)).toBe(true);
    expect(jumpsFromLast(63, 70)).toBe(true);
    expect(jumpsFromLast(76.9, 70)).toBe(false);
    expect(jumpsFromLast(70, null)).toBe(false);
    expect(jumpsFromLast(70, undefined)).toBe(false);
  });
});

const NOW = Date.parse('2026-11-28T12:00:00Z');
const row = (id: string, kg: number, daysAgo: number, unit: 'kg' | 'lb' = 'kg'): WeightRow => ({ id, weight_kg: kg, entered_unit: unit, taken_at: new Date(NOW - daysAgo * 86_400_000).toISOString() });

describe('chart helpers', () => {
  const rows = [row('c', 71, 1), row('a', 70, 40), row('b', 69.5, 10)];
  it('windows by days, oldest first', () => {
    expect(windowWeights(rows, 30, NOW).map((r) => r.id)).toEqual(['b', 'c']);
    expect(windowWeights(rows, 90, NOW).map((r) => r.id)).toEqual(['a', 'b', 'c']);
    expect(windowWeights(rows, 7, NOW).map((r) => r.id)).toEqual(['c']);
    expect(windowWeights([{ ...row('x', 70, 1), taken_at: 'nope' }], 30, NOW)).toEqual([]);
  });
  it('makes a tidy axis that holds every value, in either unit', () => {
    for (const u of ['kg', 'lb'] as const) {
      const s = weightScale(rows, u);
      expect(s.ticks.length).toBeGreaterThan(1);
      expect(s.ticks.length).toBeLessThanOrEqual(7);
      for (const r of rows) { const v = fromKg(r.weight_kg, u); expect(v).toBeGreaterThanOrEqual(s.min); expect(v).toBeLessThanOrEqual(s.max); }
    }
    const same = weightScale([row('a', 70, 1), row('b', 70, 2)], 'kg');
    expect(same.max).toBeGreaterThan(same.min);
  });
  it('gives the span and a neutral signed change', () => {
    expect(weightSpan([], 'kg')).toBeNull();
    expect(weightSpan(windowWeights(rows, 90, NOW), 'kg')).toEqual({ lo: 69.5, hi: 71 });
    expect(changeInWindow(windowWeights(rows, 90, NOW), 'kg')).toBe(1);
    expect(changeInWindow(windowWeights(rows, 30, NOW), 'kg')).toBe(1.5);
    expect(changeInWindow([row('a', 70, 1)], 'kg')).toBeNull();
  });
});

// @ts-ignore node types are not installed in this Expo project; vitest runs on node
import { readFileSync } from 'node:fs';
describe('weight screens', () => {
  const src = (rel: string): string => readFileSync(new URL(rel, import.meta.url), 'utf8');
  it('the weight screen reads and writes only weight_readings and says nothing about good or bad', () => {
    const s = (src('../app/feature/weight.tsx') + src('../components/WeightChart.tsx')).replace(/^\s*\/\/.*$/gm, '');
    expect(s).toContain("from('weight_readings')");
    expect(s).not.toMatch(/\b(target|goal|healthy|overweight|underweight|normal|ideal)\b/i);
  });
  it('Today and the condition card open the weight log', () => {
    expect(src('../app/(tabs)/index.tsx')).toContain("'/feature/weight'");
    expect(src('../components/TrackingSuggestions.tsx')).toContain("'/feature/weight'");
  });
});
