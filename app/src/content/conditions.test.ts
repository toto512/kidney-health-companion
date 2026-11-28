import { describe, expect, it } from 'vitest';
import { CONDITIONS, sourceReviewOverdue } from './conditions';

describe('condition content', () => {
  it('has all five conditions for all three countries', () => {
    expect(CONDITIONS).toHaveLength(5);
    for (const c of CONDITIONS) for (const k of ['CA', 'US', 'GB'] as const) expect(c.facts[k]).toBeTruthy();
  });
  it('gives every fact a quote, https link and check date', () => {
    for (const c of CONDITIONS) for (const f of Object.values(c.facts)) {
      expect(f.quote.length).toBeGreaterThan(20);
      expect(f.url.startsWith('https://')).toBe(true);
      expect(f.checkedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
  it('flags a source whose own review date has passed', () => {
    const f = CONDITIONS[0].facts.GB;
    expect(sourceReviewOverdue(f, new Date('2026-11-15'))).toBe(true);
    expect(sourceReviewOverdue(CONDITIONS[0].facts.US, new Date('2026-11-15'))).toBe(false);
  });
});

import { EXTRAS } from './conditions';
describe('extras', () => {
  it('only keys real condition and country pairs', () => {
    for (const k of Object.keys(EXTRAS)) {
      const [id, cc] = k.split('.');
      expect(CONDITIONS.find((c) => c.id === id)?.facts[cc as 'CA']).toBeTruthy();
    }
  });
});
