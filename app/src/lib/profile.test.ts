import { describe, expect, it } from 'vitest';
import { cmToFeetInches, feetInchesToCm, isProfileComplete, isSupported, kgToLb, lbToKg, parseHeightCm, parseProfile, parseWeightKg } from './profile';

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

describe('unit conversion', () => {
  it('converts feet and inches to cm with 1 decimal', () => {
    expect(feetInchesToCm(5, 10)).toBe(177.8);
    expect(feetInchesToCm(6, 0)).toBe(182.9);
    expect(feetInchesToCm(5, 0)).toBe(152.4);
  });
  it('converts cm to feet and inches, rounding to the nearest inch', () => {
    expect(cmToFeetInches(178)).toEqual({ ft: 5, inch: 10 });
    expect(cmToFeetInches(152.4)).toEqual({ ft: 5, inch: 0 });
    expect(cmToFeetInches(182.9)).toEqual({ ft: 6, inch: 0 });
    expect(cmToFeetInches(182.0)).toEqual({ ft: 6, inch: 0 });
  });
  it('converts lb and kg with 1 decimal', () => {
    expect(lbToKg(200)).toBe(90.7);
    expect(lbToKg(150)).toBe(68);
    expect(kgToLb(92)).toBe(202.8);
    expect(kgToLb(lbToKg(200))).toBe(200);
  });
  it('parses height in either unit and checks range after conversion', () => {
    expect(parseHeightCm('cm', '178', '', '')).toBe(178);
    expect(parseHeightCm('ft', '', '5', '10')).toBe(177.8);
    expect(parseHeightCm('ft', '', '5', '')).toBe(152.4);
    expect(parseHeightCm('ft', '', '5', '12')).toBe(null);
    expect(parseHeightCm('ft', '', '', '10')).toBe(null);
    expect(parseHeightCm('ft', '', '1', '0')).toBe(null);
    expect(parseHeightCm('ft', '', '9', '0')).toBe(null);
    expect(parseHeightCm('cm', '5.10', '', '')).toBe(null);
  });
  it('parses weight in either unit and checks range after conversion', () => {
    expect(parseWeightKg('kg', '92')).toBe(92);
    expect(parseWeightKg('kg', '70,5')).toBe(70.5);
    expect(parseWeightKg('lb', '200')).toBe(90.7);
    expect(parseWeightKg('lb', '40')).toBe(null);
    expect(parseWeightKg('lb', '900')).toBe(null);
    expect(parseWeightKg('kg', '')).toBe(null);
  });
  it('stores canonical cm and kg when entered in feet and pounds', () => {
    const r = parseProfile({ ...base, height: '', heightFt: '5', heightIn: '10', heightUnit: 'ft', weight: '200', weightUnit: 'lb' }, today);
    expect(r.ok && [r.value.height_cm, r.value.weight_kg]).toEqual([177.8, 90.7]);
  });
  it('accepts the values from the reported screenshot (178 cm, 92 kg)', () => {
    const r = parseProfile({ ...base, sex: 'male', dob: '1980-07-21', height: '178', weight: '92' }, today);
    expect(r.ok).toBe(true);
  });
});
