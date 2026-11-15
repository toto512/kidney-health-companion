import { describe, expect, it } from 'vitest';
import { EMERGENCY } from './emergency';

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
