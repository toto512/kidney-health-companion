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
    expect(parseReading('120', '80', '25').ok).toBe(false);
    expect(parseReading('abc', '80', '').ok).toBe(false);
    expect(parseReading('120', '80', '300').ok).toBe(false);
    expect(parseReading('12.5', '80', '').ok).toBe(false);
  });
  it('rejects top number not above bottom number', () => {
    expect(parseReading('80', '80', '').ok).toBe(false);
    expect(parseReading('70', '90', '').ok).toBe(false);
  });
});

import { BP_LIMITS, ENTRY_LIMITS, needsHelpLine } from './bp';
describe('ENTRY_LIMITS', () => {
  it('matches what parseReading accepts at both ends', () => {
    expect(parseReading(String(ENTRY_LIMITS.systolic.max), String(ENTRY_LIMITS.diastolic.min), String(ENTRY_LIMITS.pulse.min)).ok).toBe(true);
    expect(parseReading(String(ENTRY_LIMITS.systolic.min + 1), String(ENTRY_LIMITS.diastolic.min), String(ENTRY_LIMITS.pulse.max)).ok).toBe(true);
    expect(parseReading(String(ENTRY_LIMITS.systolic.max + 1), '80', '').ok).toBe(false);
    expect(parseReading('120', String(ENTRY_LIMITS.diastolic.min - 1), '').ok).toBe(false);
    expect(parseReading('120', '80', String(ENTRY_LIMITS.pulse.max + 1)).ok).toBe(false);
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

describe('blocked low entries and the contact line', () => {
  it('blocks top below 70, bottom below 40 and pulse below 30 (including 40/21 with pulse 21)', () => {
    expect(parseReading('69', '50', '').ok).toBe(false);
    expect(parseReading('120', '39', '').ok).toBe(false);
    expect(parseReading('120', '80', '29').ok).toBe(false);
    expect(parseReading('40', '21', '21').ok).toBe(false);
    expect(parseReading('70', '40', '30').ok).toBe(true);
  });
  it('keeps the database limits wider than the entry limits', () => {
    expect(BP_LIMITS.systolic.min).toBeLessThan(ENTRY_LIMITS.systolic.min);
    expect(BP_LIMITS.diastolic.min).toBeLessThan(ENTRY_LIMITS.diastolic.min);
    expect(BP_LIMITS.pulse.min).toBeLessThan(ENTRY_LIMITS.pulse.min);
    expect(BP_LIMITS.systolic.max).toBe(ENTRY_LIMITS.systolic.max);
  });
  it('adds the contact line only for very low or very high numbers', () => {
    expect(needsHelpLine('40', '21', '21')).toBe(true);
    expect(needsHelpLine('69', '', '')).toBe(true);
    expect(needsHelpLine('120', '39', '')).toBe(true);
    expect(needsHelpLine('260', '90', '')).toBe(true);
    expect(needsHelpLine('140', '151', '')).toBe(true);
    expect(needsHelpLine('120', '80', '29')).toBe(true);
    expect(needsHelpLine('120', '80', '70')).toBe(false);
    expect(needsHelpLine('170', '100', '')).toBe(false);
    expect(needsHelpLine('', '', '')).toBe(false);
    expect(needsHelpLine('abc', '', '')).toBe(false);
  });
});
