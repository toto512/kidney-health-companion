import { describe, expect, it } from 'vitest';
import { checkReading, parseReading } from './bp';

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

import { BP_LIMITS } from './bp';
describe('BP_LIMITS', () => {
  it('matches what parseReading accepts at both ends', () => {
    expect(parseReading(String(BP_LIMITS.systolic.max), String(BP_LIMITS.diastolic.min), String(BP_LIMITS.pulse.min)).ok).toBe(true);
    expect(parseReading(String(BP_LIMITS.systolic.min + 1), String(BP_LIMITS.diastolic.min), String(BP_LIMITS.pulse.max)).ok).toBe(true);
    expect(parseReading(String(BP_LIMITS.systolic.max + 1), '80', '').ok).toBe(false);
    expect(parseReading('120', String(BP_LIMITS.diastolic.min - 1), '').ok).toBe(false);
    expect(parseReading('120', '80', String(BP_LIMITS.pulse.max + 1)).ok).toBe(false);
  });
});

describe('checkReading', () => {
  const v = (systolic: number, diastolic: number) => ({ systolic, diastolic, pulse: null });
  it('flags typing slips such as 40/21', () => {
    expect(checkReading(v(40, 21))).toContain('Check this number');
    expect(checkReading(v(300, 80))).not.toBeNull();
    expect(checkReading(v(120, 118))).not.toBeNull();
    expect(checkReading(v(120, 30))).not.toBeNull();
  });
  it('does not flag ordinary entries and never labels them', () => {
    expect(checkReading(v(120, 80))).toBeNull();
    expect(checkReading(v(95, 60))).toBeNull();
    expect(checkReading(v(170, 100))).toBeNull();
  });
});
