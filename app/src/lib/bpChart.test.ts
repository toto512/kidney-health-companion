import { describe, expect, it } from 'vitest';
import { ChartRow, summary, windowRows, xFraction, yScale } from './bpChart';

const NOW = Date.parse('2026-11-16T12:00:00Z');
const row = (id: string, daysAgo: number, systolic: number, diastolic: number): ChartRow => ({ id, systolic, diastolic, pulse: null, taken_at: new Date(NOW - daysAgo * 86_400_000).toISOString() });

describe('windowRows', () => {
  const rows = [row('a', 40, 130, 85), row('b', 3, 118, 72), row('c', 10, 142, 90)];
  it('keeps only readings inside the window, oldest first', () => {
    expect(windowRows(rows, 7, NOW).map((r) => r.id)).toEqual(['b']);
    expect(windowRows(rows, 30, NOW).map((r) => r.id)).toEqual(['c', 'b']);
    expect(windowRows(rows, 90, NOW).map((r) => r.id)).toEqual(['a', 'c', 'b']);
  });
  it('ignores unreadable dates', () => {
    expect(windowRows([{ ...row('x', 1, 120, 80), taken_at: 'nope' }], 7, NOW)).toEqual([]);
  });
});

describe('yScale', () => {
  it('pads by 10 and rounds to tens, with at most 6 lines', () => {
    const s = yScale([row('a', 1, 142, 72), row('b', 2, 118, 80)]);
    expect(s.min).toBe(60); expect(s.max).toBe(160);
    expect(s.ticks.length).toBeLessThanOrEqual(6);
    expect(s.ticks[0]).toBeGreaterThanOrEqual(s.min);
    expect(s.ticks[s.ticks.length - 1]).toBeLessThanOrEqual(s.max);
  });
  it('never goes below zero', () => {
    expect(yScale([row('a', 1, 60, 25)]).min).toBe(10);
    expect(yScale([row('a', 1, 45, 22)]).min).toBeGreaterThanOrEqual(0);
  });
});

describe('xFraction', () => {
  it('maps the window to 0..1 and clamps', () => {
    expect(xFraction(50, 0, 100)).toBe(0.5);
    expect(xFraction(-5, 0, 100)).toBe(0);
    expect(xFraction(500, 0, 100)).toBe(1);
    expect(xFraction(5, 5, 5)).toBe(0.5);
  });
});

describe('summary', () => {
  it('words the range and counts', () => {
    expect(summary([row('a', 1, 118, 72), row('b', 2, 142, 90)], 30)).toBe('Last 30 days: 2 readings, top 118 to 142, bottom 72 to 90.');
    expect(summary([row('a', 1, 120, 80)], 7)).toBe('Last 7 days: 1 reading, top 120, bottom 80.');
    expect(summary([], 90)).toBe('Last 90 days: no readings.');
  });
});
