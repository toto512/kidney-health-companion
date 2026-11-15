import { describe, expect, it } from 'vitest';
import { EMERGENCY, emergencyView } from './emergency';

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
    expect(emergencyView('FR')).toEqual({ kind: 'none', code: 'FR' });
    expect(emergencyView(null)).toEqual({ kind: 'all' });
    expect(emergencyView(undefined)).toEqual({ kind: 'all' });
    expect(emergencyView('ca')).toEqual({ kind: 'none', code: 'ca' });
  });
});
