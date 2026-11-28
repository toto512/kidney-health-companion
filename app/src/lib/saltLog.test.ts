import { describe, expect, it } from 'vitest';
import { addDays, axis, byDay, canSave, draftFromTotals, inWindow, localIso, windowPoints, type SaltRow } from './saltLog';
import { plateTotals, portionAmounts } from './plateScan';
import { FOODS } from '../content/foods';
import type { PlateTotal } from './plateScan';

const row = (id: string, day: string, mg: number, counted = 2, total = 3): SaltRow => ({ id, logged_on: day, sodium_mg: mg, foods_counted: counted, foods_total: total });
const tot = (value: number | null, counted: number, of: number): PlateTotal[] => [{ nutrient: 'sodiumMg', value, counted, of }, { nutrient: 'potassiumMg', value: 5, counted: 1, of }];

describe('draftFromTotals', () => {
  it('keeps the sodium total as whole mg with both food counts', () => {
    expect(draftFromTotals(tot(412.6, 2, 3), '2026-12-01')).toEqual({ logged_on: '2026-12-01', sodium_mg: 413, foods_counted: 2, foods_total: 3 });
  });
  it('refuses when no food has an official sodium number', () => {
    expect(draftFromTotals(tot(null, 0, 3), '2026-12-01')).toBeNull();
    expect(draftFromTotals(tot(100, 0, 3), '2026-12-01')).toBeNull();
  });
  it('refuses a missing sodium line and impossible counts', () => {
    expect(draftFromTotals([], '2026-12-01')).toBeNull();
    expect(draftFromTotals(tot(100, 4, 3), '2026-12-01')).toBeNull();
    expect(draftFromTotals(tot(-5, 1, 1), '2026-12-01')).toBeNull();
    expect(draftFromTotals(tot(100_001, 1, 1), '2026-12-01')).toBeNull();
  });
  it('takes the sodium total from real plate totals and counts foods without an official number as missing', () => {
    const withNum = FOODS.map((f) => ({ id: f.id, portion: 'medium' as const })).filter((e) => portionAmounts(e, 'US')?.rows.find((r) => r.nutrient === 'sodiumMg')?.value != null).slice(0, 2);
    const without = FOODS.map((f) => ({ id: f.id, portion: 'medium' as const })).find((e) => portionAmounts(e, 'US') === null);
    expect(withNum).toHaveLength(2);
    expect(without).toBeDefined();
    const items = [...withNum, without!];
    const d = draftFromTotals(plateTotals(items, 'US'), '2026-12-01');
    expect(d).not.toBeNull();
    expect(d!.foods_counted).toBe(2);
    expect(d!.foods_total).toBe(3);
    const sum = withNum.reduce((a, e) => a + portionAmounts(e, 'US')!.rows.find((r) => r.nutrient === 'sodiumMg')!.raw!, 0);
    expect(d!.sodium_mg).toBe(Math.round(sum));
  });
  it('a plate with no official numbers cannot be saved', () => {
    const none = FOODS.map((f) => ({ id: f.id, portion: 'medium' as const })).filter((e) => portionAmounts(e, 'US') === null).slice(0, 2);
    expect(draftFromTotals(plateTotals(none, 'US'), '2026-12-01')).toBeNull();
  });
});

describe('dates', () => {
  it('localIso uses the local calendar day', () => expect(localIso(new Date(2026, 11, 1, 23, 59))).toBe('2026-12-01'));
  it('addDays crosses month and year ends', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDays('2024-03-01', -1)).toBe('2024-02-29');
  });
});

describe('byDay', () => {
  const rows = [row('a', '2026-11-30', 500, 2, 3), row('b', '2026-12-01', 300, 1, 2), row('c', '2026-12-01', 700, 3, 3)];
  it('sums plates per day, newest day first, and sums the food counts', () => {
    const d = byDay(rows);
    expect(d.map((x) => x.day)).toEqual(['2026-12-01', '2026-11-30']);
    expect(d[0]).toMatchObject({ mg: 1000, counted: 4, total: 5, missing: 1 });
    expect(d[0].plates.map((p) => p.id)).toEqual(['b', 'c']);
  });
  it('a day with a missing food always reports it, never a full total', () => {
    expect(byDay([row('x', '2026-12-01', 100, 1, 4)])[0].missing).toBe(3);
  });
  it('empty input gives no days', () => expect(byDay([])).toEqual([]));
});

describe('windowPoints and inWindow', () => {
  const rows = [row('a', '2026-11-25', 500), row('b', '2026-12-01', 300), row('c', '2026-12-01', 200), row('old', '2026-10-01', 900)];
  it('lists every day oldest first and leaves a gap (null) where nothing was saved', () => {
    const p = windowPoints(rows, 7, '2026-12-01');
    expect(p).toHaveLength(7);
    expect(p[0].day).toBe('2026-11-25'); expect(p[6].day).toBe('2026-12-01');
    expect(p[0].mg).toBe(500); expect(p[3].mg).toBeNull(); expect(p[6].mg).toBe(500);
  });
  it('30 days drops older rows', () => {
    expect(windowPoints(rows, 30, '2026-12-01').some((x) => x.mg === 900)).toBe(false);
    expect(inWindow(rows, 7, '2026-12-01').map((r) => r.id)).toEqual(['a', 'b', 'c']);
    expect(inWindow(rows, 30, '2026-12-01').map((r) => r.id)).toEqual(['a', 'b', 'c']);
  });
  it('a plate dated after today is not in the window', () => expect(inWindow([row('f', '2026-12-05', 1)], 7, '2026-12-01')).toEqual([]));
});

describe('axis', () => {
  it('starts at zero, rounds the top up, and has at most 5 lines', () => {
    for (const top of [1, 99, 350, 1234, 2600, 8000, 99999]) {
      const a = axis([{ day: 'x', mg: top }]);
      expect(a.ticks[0]).toBe(0);
      expect(a.max).toBeGreaterThanOrEqual(top);
      expect(a.ticks.length).toBeLessThanOrEqual(5);
      expect(a.ticks[a.ticks.length - 1]).toBe(a.max);
    }
  });
  it('an empty window still has a usable axis', () => expect(axis([{ day: 'x', mg: null }]).max).toBe(1000));
});

describe('canSave', () => {
  const d = { logged_on: '2026-12-01', sodium_mg: 1, foods_counted: 1, foods_total: 1 };
  it('needs a draft and room', () => {
    expect(canSave(null, 0)).toBe('none');
    expect(canSave(d, 499)).toBe('ok');
    expect(canSave(d, 500)).toBe('limit');
  });
});
