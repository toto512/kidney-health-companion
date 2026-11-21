import { describe, expect, it } from 'vitest';
import { canAddMore, displayPhone, MAX_CONTACTS, normalizePhone, relationshipLabel, telHref, validateContact } from './contactLogic';

describe('normalizePhone', () => {
  it('CA and US 10 digits and 11 digits with 1', () => {
    expect(normalizePhone('(613) 555-0123', 'CA')).toBe('+16135550123');
    expect(normalizePhone('1 613 555 0123', 'US')).toBe('+16135550123');
  });
  it('rejects NANP numbers with a leading 0 or 1 area code', () => {
    expect(normalizePhone('013 555 0123', 'CA')).toBeNull();
    expect(normalizePhone('6135550', 'CA')).toBeNull();
  });
  it('GB drops the trunk 0', () => { expect(normalizePhone('07700 900123', 'GB')).toBe('+447700900123'); });
  it('keeps an explicit +country for any profile country', () => {
    expect(normalizePhone('+33 1 23 45 67 89', 'CA')).toBe('+33123456789');
    expect(normalizePhone('+33 1 23 45 67 89', null)).toBe('+33123456789');
  });
  it('does not guess a country code', () => {
    expect(normalizePhone('0123456789', 'FR')).toBeNull();
    expect(normalizePhone('6135550123', null)).toBeNull();
  });
  it('rejects letters, a stray plus and too-short numbers', () => {
    expect(normalizePhone('call me', 'CA')).toBeNull();
    expect(normalizePhone('613+5550123', 'CA')).toBeNull();
    expect(normalizePhone('+123', 'CA')).toBeNull();
    expect(normalizePhone('+0123456789', 'CA')).toBeNull();
    expect(normalizePhone('', 'CA')).toBeNull();
  });
});

describe('validateContact', () => {
  it('accepts and trims', () => {
    const r = validateContact({ name: '  Test   Person ', relationship: 'child', phone: '613-555-0123' }, 'CA');
    expect(r).toEqual({ ok: true, value: { name: 'Test Person', relationship: 'child', phone: '+16135550123' } });
  });
  it('rejects empty or long name, unknown relationship, bad phone', () => {
    expect(validateContact({ name: ' ', relationship: 'child', phone: '+16135550123' }, 'CA').ok).toBe(false);
    expect(validateContact({ name: 'x'.repeat(61), relationship: 'child', phone: '+16135550123' }, 'CA').ok).toBe(false);
    expect(validateContact({ name: 'A', relationship: 'boss', phone: '+16135550123' }, 'CA').ok).toBe(false);
    expect(validateContact({ name: 'A', relationship: 'doctor', phone: 'abc' }, 'CA').ok).toBe(false);
  });
});

describe('display and limits', () => {
  it('groups NANP, leaves others', () => {
    expect(displayPhone('+16135550123')).toBe('+1 (613) 555-0123');
    expect(displayPhone('+447700900123')).toBe('+447700900123');
  });
  it('tel href only for valid numbers', () => {
    expect(telHref('+16135550123')).toBe('tel:+16135550123');
    expect(telHref('6135550123')).toBeNull();
  });
  it('limit is 5', () => { expect(MAX_CONTACTS).toBe(5); expect(canAddMore(4)).toBe(true); expect(canAddMore(5)).toBe(false); });
  it('labels', () => { expect(relationshipLabel('nurse')).toBe('Nurse'); expect(relationshipLabel('zzz')).toBe('Someone else'); });
});
