import { describe, expect, it } from 'vitest';
import { countryName } from '../lib/profile';
import { EMERGENCY, emergencyView, LISTED_EMERGENCY } from './emergency';

describe('emergency content', () => {
  it('covers CA, US, GB and names the number inside its own quote or source page text', () => {
    for (const k of ['CA', 'US', 'GB'] as const) {
      const e = EMERGENCY[k];
      expect(e.url.startsWith('https://')).toBe(true);
      expect(e.quote).toContain(e.number);
      expect(e.checkedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});

describe('emergencyView follows the saved profile country', () => {
  it('shows only the checked entry for Canada, the US and the UK', () => {
    expect(emergencyView('CA')).toEqual({ kind: 'supported', country: 'CA' });
    expect(emergencyView('US')).toEqual({ kind: 'supported', country: 'US' });
    expect(emergencyView('GB')).toEqual({ kind: 'supported', country: 'GB' });
  });
  it('changes as soon as the country changes', () => {
    expect(emergencyView('CA')).not.toEqual(emergencyView('GB'));
    expect(EMERGENCY[(emergencyView('GB') as { country: 'GB' }).country].number).toBe('999');
    expect(EMERGENCY[(emergencyView('CA') as { country: 'CA' }).country].number).toBe('9-1-1');
  });
  it('gives no number for other countries and all three when no country is saved', () => {
    expect(emergencyView('KR')).toEqual({ kind: 'none', code: 'KR' });
    expect(emergencyView(null)).toEqual({ kind: 'all' });
    expect(emergencyView(undefined)).toEqual({ kind: 'all' });
    expect(emergencyView('ca')).toEqual({ kind: 'none', code: 'ca' });
  });
});

describe('listed countries (official government pages)', () => {
  for (const [code, e] of Object.entries(LISTED_EMERGENCY)) {
    it(`${code}: every number appears in the quote, the link is https, and the dates are well formed`, () => {
      expect(e.tokens.length).toBeGreaterThan(0);
      for (const t of e.tokens) expect(e.quote).toContain(t);
      expect(e.url.startsWith('https://')).toBe(true);
      expect(e.checkedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(e.source.length).toBeGreaterThan(3);
      expect(emergencyView(code)).toEqual({ kind: 'listed', code });
    });
  }
  it('has a government host for every link', () => {
    for (const e of Object.values(LISTED_EMERGENCY)) expect(new URL(e.url).hostname).toMatch(/(^|\.)(gov\.[a-z]{2}|govt\.nz|go\.jp|gob\.mx|gob\.es|gov|service-public\.fr)$/);
  });
});

describe('alphabetical order', () => {
  it('lists the countries A to Z by name', () => {
    const names = Object.keys(LISTED_EMERGENCY).map((c) => countryName(c));
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });
});
