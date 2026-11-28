import { describe, expect, it } from 'vitest';
import { setDatePart } from './calendarLogic';
import { dayItems, daysInMonth, hourItems, indexFromOffset, indexOfValue, minuteItems, monthItems, offsetForIndex, rowHeight, yearItems } from './wheelLogic';

describe('wheel offsets', () => {
  it('snaps to the nearest row and stays in range', () => {
    expect(indexFromOffset(0, 56, 24)).toBe(0); expect(indexFromOffset(83, 56, 24)).toBe(1); expect(indexFromOffset(85, 56, 24)).toBe(2);
    expect(indexFromOffset(-30, 56, 24)).toBe(0); expect(indexFromOffset(99999, 56, 24)).toBe(23);
    expect(indexFromOffset(10, 0, 5)).toBe(0); expect(indexFromOffset(10, 56, 0)).toBe(0);
    expect(offsetForIndex(3, 56)).toBe(168);
  });
  it('row height grows with the text and never drops below a tap target', () => {
    expect(rowHeight(20, 56)).toBe(56); expect(rowHeight(40, 56)).toBe(72); expect(rowHeight(10, 56)).toBe(56);
  });
});
describe('wheel items', () => {
  it('days follow the month, including leap years', () => {
    expect(dayItems(2026, 1)).toHaveLength(28); expect(dayItems(2024, 1)).toHaveLength(29); expect(dayItems(2026, 10)).toHaveLength(30); expect(daysInMonth(2026, 11)).toBe(31);
  });
  it('12 months, years 2000 to 2100, 24 hours', () => {
    expect(monthItems((m) => `m${m}`)).toHaveLength(12); expect(yearItems()[0].value).toBe(2000); expect(yearItems().at(-1)?.value).toBe(2100);
    expect(hourItems().map((h) => h.label)).toEqual(Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')));
  });
  it('minutes go in fives, and an odd saved minute stays selectable', () => {
    expect(minuteItems().map((m) => m.value)).toEqual([0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]);
    expect(minuteItems(32).map((m) => m.value)).toContain(32); expect(minuteItems(32)).toHaveLength(13);
    expect(minuteItems(30)).toHaveLength(12); expect(minuteItems()[0].label).toBe('00');
  });
  it('finds the row of a value, 0 when missing', () => { expect(indexOfValue(hourItems(), 9)).toBe(9); expect(indexOfValue(hourItems(), 99)).toBe(0); });
});
describe('setDatePart', () => {
  it('sets each part and pulls the day back into a shorter month', () => {
    expect(setDatePart('2026-01-31', 'month', 1)).toBe('2026-02-28');
    expect(setDatePart('2024-02-29', 'year', 2025)).toBe('2025-02-28');
    expect(setDatePart('2026-11-19', 'day', 5)).toBe('2026-11-05');
    expect(setDatePart('2026-11-19', 'month', 11)).toBe('2026-12-19');
  });
  it('stays inside 2000 to 2100 and 1 to the last day', () => {
    expect(setDatePart('2026-11-19', 'year', 2200)).toBe('2100-11-19'); expect(setDatePart('2026-11-19', 'year', 1900)).toBe('2000-11-19');
    expect(setDatePart('2026-11-19', 'day', 99)).toBe('2026-11-30'); expect(setDatePart('2026-11-19', 'day', 0)).toBe('2026-11-01');
  });
});
