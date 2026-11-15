import { describe, expect, it } from 'vitest';
import { parseReading } from './bp';

describe('parseReading', () => {
  it('accepts a normal entry with pulse', () => {
    expect(parseReading('120', '80', '70')).toEqual({ ok: true, value: { systolic: 120, diastolic: 80, pulse: 70 } });
  });
  it('accepts empty pulse', () => {
    expect(parseReading('120', '80', '')).toEqual({ ok: true, value: { systolic: 120, diastolic: 80, pulse: null } });
  });
  it('rejects out-of-range and non-numeric values', () => {
    expect(parseReading('30', '80', '').ok).toBe(false);
    expect(parseReading('120', '10', '').ok).toBe(false);
    expect(parseReading('abc', '80', '').ok).toBe(false);
    expect(parseReading('120', '80', '300').ok).toBe(false);
    expect(parseReading('12.5', '80', '').ok).toBe(false);
  });
  it('rejects top number not above bottom number', () => {
    expect(parseReading('80', '80', '').ok).toBe(false);
    expect(parseReading('70', '90', '').ok).toBe(false);
  });
});
