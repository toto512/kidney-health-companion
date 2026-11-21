import { describe, expect, it } from 'vitest';
import { CONDITION_LIST, conditionById, DOMAINS, groupByDomain, searchConditions } from './conditionList';

describe('condition list', () => {
  it('has 80 conditions in 7 domains with unique, stable ids', () => {
    expect(CONDITION_LIST).toHaveLength(80);
    expect(DOMAINS).toHaveLength(7);
    const ids = CONDITION_LIST.map((c) => c.id);
    expect(new Set(ids).size).toBe(80);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    expect(new Set(CONDITION_LIST.map((c) => c.name.toLowerCase())).size).toBe(80);
  });
  it('gives every condition a name, a known domain and at least one tracking prompt', () => {
    for (const c of CONDITION_LIST) {
      expect(c.name.trim().length, c.id).toBeGreaterThan(2);
      expect(DOMAINS, c.id).toContain(c.domain);
      expect(c.track.length, c.id).toBeGreaterThan(0);
      for (const t of c.track) expect(t.trim().length, c.id).toBeGreaterThan(2);
    }
    for (const d of DOMAINS) expect(CONDITION_LIST.some((c) => c.domain === d), d).toBe(true);
  });
  it('keeps the prompts to plain things to write down: no numbers, targets, alerts or advice', () => {
    for (const c of CONDITION_LIST) for (const t of c.track) {
      expect(t, c.id).not.toMatch(/\d/);
      expect(t, c.id).not.toMatch(/\b(alert|seek|urgent|emergency|target|should|avoid|normal|poor control|screening|diet|dose)\b/i);
    }
  });
  it('marks blood pressure only where a prompt mentions it', () => {
    for (const c of CONDITION_LIST) expect(!!c.bp, c.id).toBe(c.track.some((t) => /blood pressure/i.test(t)));
  });
  it('covers the five conditions already on My conditions', () => {
    for (const id of ['hypertension', 'ckd', 'gout', 'type-2-diabetes', 'ischemic-heart-disease']) expect(conditionById(id), id).toBeTruthy();
  });
  it('searches by plain name and groups by domain', () => {
    expect(searchConditions('kidney').map((c) => c.id)).toEqual(expect.arrayContaining(['ckd', 'polycystic-kidney']));
    expect(searchConditions('  ')).toHaveLength(80);
    expect(searchConditions('zzzz')).toEqual([]);
    expect(groupByDomain(CONDITION_LIST)).toHaveLength(7);
  });
});
