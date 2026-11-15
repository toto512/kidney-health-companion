import { describe, expect, it } from 'vitest';
import { isProfileComplete, isSupported, parseProfile } from './profile';

const today = new Date('2026-11-15T00:00:00Z');
const base = { name: 'Test User', dob: '1950-03-27', sex: 'female', height: '170', weight: '70.5', country: 'CA' };

describe('parseProfile', () => {
  it('accepts a full profile', () => {
    expect(parseProfile(base, today)).toEqual({ ok: true, value: { name: 'Test User', dob: '1950-03-27', sex_at_birth: 'female', height_cm: 170, weight_kg: 70.5, country_code: 'CA' } });
  });
  it('keeps name optional only', () => {
    const r = parseProfile({ ...base, name: '' }, today);
    expect(r.ok && r.value.name).toBe(null);
  });
  it.each(['dob', 'sex', 'height', 'weight', 'country'] as const)('requires %s', (k) => {
    expect(parseProfile({ ...base, [k]: '' }, today).ok).toBe(false);
  });
  it('accepts any real ISO country code and rejects unknown ones', () => {
    expect(parseProfile({ ...base, country: 'FR' }, today).ok).toBe(true);
    expect(parseProfile({ ...base, country: 'ZZ' }, today).ok).toBe(false);
  });
  it('rejects impossible or future dates', () => {
    expect(parseProfile({ ...base, dob: '1950-02-31' }, today).ok).toBe(false);
    expect(parseProfile({ ...base, dob: '2030-01-01' }, today).ok).toBe(false);
    expect(parseProfile({ ...base, dob: '27/03/1950' }, today).ok).toBe(false);
    expect(parseProfile({ ...base, dob: '1850-01-01' }, today).ok).toBe(false);
  });
  it('rejects bad sex, height and weight', () => {
    expect(parseProfile({ ...base, sex: 'x' }, today).ok).toBe(false);
    expect(parseProfile({ ...base, height: '10' }, today).ok).toBe(false);
    expect(parseProfile({ ...base, weight: '999' }, today).ok).toBe(false);
    expect(parseProfile({ ...base, weight: 'abc' }, today).ok).toBe(false);
  });
});

describe('isProfileComplete', () => {
  const row = { country_code: 'CA', dob: '1950-03-27', sex_at_birth: 'male', height_cm: 170, weight_kg: 70 };
  it('is true only with every required field', () => {
    expect(isProfileComplete(row)).toBe(true);
    expect(isProfileComplete({ ...row, sex_at_birth: null })).toBe(false);
    expect(isProfileComplete({ ...row, weight_kg: null })).toBe(false);
    expect(isProfileComplete(null)).toBe(false);
  });
});

describe('isSupported', () => {
  it('knows which countries have verified content', () => {
    expect(isSupported('CA') && isSupported('US') && isSupported('GB')).toBe(true);
    expect(isSupported('FR')).toBe(false);
    expect(isSupported(null)).toBe(false);
  });
});
