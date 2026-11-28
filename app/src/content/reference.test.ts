import { describe, expect, it } from 'vitest';
import { isGap, overdue, REFERENCE, referenceFor, SOURCES } from './reference';

const HOSTS: Record<string, RegExp> = {
  GB: /^(www\.)?nhs\.uk$/,
  US: /(^|\.)(nih\.gov|cdc\.gov|medlineplus\.gov)$/,
  CA: /^(www\.)?(canada\.ca|healthlinkbc\.ca)$/,
};
const all = Object.entries(REFERENCE).flatMap(([country, byCond]) => Object.entries(byCond).flatMap(([cond, items]) => items.map((e) => ({ country, cond, e }))));

describe('reference content', () => {
  it('has all five conditions for all three countries', () => {
    for (const c of ['GB', 'US', 'CA'] as const) expect(Object.keys(REFERENCE[c]).sort()).toEqual(['ckd', 'diabetes', 'gout', 'hbp', 'heart']);
  });
  it('gives every item at least one quote, an https link and a check date', () => {
    expect(all.length).toBeGreaterThan(60);
    for (const { e } of all) {
      if (isGap(e)) continue;
      expect(e.quotes.length, e.id).toBeGreaterThan(0);
      for (const q of e.quotes) expect(q.trim().length, e.id).toBeGreaterThan(3);
      const s = SOURCES[e.src];
      expect(s, `${e.id} source`).toBeTruthy();
      expect(s.url.startsWith('https://'), e.id).toBe(true);
      expect(s.checkedOn, e.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(s.publisher.length, e.id).toBeGreaterThan(2);
    }
  });
  it('uses only sources of the same country, on that country\'s official hosts', () => {
    for (const { country, e } of all) {
      if (isGap(e)) continue;
      const s = SOURCES[e.src];
      expect(s.country, e.id).toBe(country);
      expect(new URL(s.url).hostname, e.id).toMatch(HOSTS[country]);
    }
  });
  it('shows no US range to Canada: Canadian potassium and uric acid are gaps', () => {
    for (const id of ['ca-ckd-potassium', 'ca-gout-uric']) {
      const e = all.find((x) => x.e.id === id)!.e;
      expect(isGap(e)).toBe(true);
    }
    expect(all.filter((x) => x.country === 'CA').every((x) => isGap(x.e) || !/medlineplus/.test(SOURCES[x.e.src].url))).toBe(true);
  });
  it('keeps our own wording free of verdicts and advice', () => {
    for (const { e } of all) expect(e.title).not.toMatch(/\b(good|bad|healthy|abnormal|should|take this)\b/i);
  });
  it('flags a source past its own review date', () => {
    expect(overdue(SOURCES['uk-ckd-treat'], new Date('2026-11-16'))).toBe(true);
    expect(overdue(SOURCES['uk-hbp'], new Date('2026-11-16'))).toBe(false);
  });
  it('returns nothing for an unknown condition', () => { expect(referenceFor('CA', 'nope')).toEqual([]); });
  it('leaves out the items still to verify', () => {
    const text = JSON.stringify(REFERENCE);
    for (const q of ['You may have CKD if your rate is lower than this.', 'ibuprofen and celecoxib', 'Examples are pain relievers called NSAIDs']) expect(text).not.toContain(q);
  });
});
