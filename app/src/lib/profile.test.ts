import { describe, expect, it } from 'vitest';
import { isSupported, parseProfile } from './profile';

const today = new Date('2026-11-15T00:00:00Z');
const base = { name: 'Test User', dob: '1950-03-27', height: '170', weight: '70.5', country: 'CA' as const };

describe('parseProfile', () => {
  it('accepts a full profile', () => {
    expect(parseProfile(base, today)).toEqual({ ok: true, value: { name: 'Test User', dob: '1950-03-27', height_cm: 170, weight_kg: 70.5, country_code: 'CA' } });
  });
  it('allows empty optional fields', () => {
    expect(parseProfile({ ...base, name: '', dob: '', height: '', weight: '' }, today)).toEqual({ ok: true, value: { name: null, dob: null, height_cm: null, weight_kg: null, country_code: 'CA' } });
  });
  it('requires a country and accepts any real ISO code', () => {
    expect(parseProfile({ ...base, country: '' }, today).ok).toBe(false);
    expect(parseProfile({ ...base, country: 'ZZ' }, today).ok).toBe(false);
    expect(parseProfile({ ...base, country: 'FR' }, today).ok).toBe(true);
  });
  it('knows which countries have verified content', () => {
    expect(isSupported('CA') && isSupported('US') && isSupported('GB')).toBe(true);
    expect(isSupported('FR')).toBe(false);
    expect(isSupported(null)).toBe(false);
  });
  it('rejects impossible or future dates', () => {
    expect(parseProfile({ ...base, dob: '1950-02-31' }, today).ok).toBe(false);
    expect(parseProfile({ ...base, dob: '2030-01-01' }, today).ok).toBe(false);
    expect(parseProfile({ ...base, dob: '27/03/1950' }, today).ok).toBe(false);
    expect(parseProfile({ ...base, dob: '1850-01-01' }, today).ok).toBe(false);
  });
  it('rejects out-of-range height and weight', () => {
    expect(parseProfile({ ...base, height: '10' }, today).ok).toBe(false);
    expect(parseProfile({ ...base, weight: '999' }, today).ok).toBe(false);
    expect(parseProfile({ ...base, weight: 'abc' }, today).ok).toBe(false);
  });
});
