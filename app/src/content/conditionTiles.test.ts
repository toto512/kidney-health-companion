import { describe, expect, it } from 'vitest';
import { MED_LIST } from './medList';
import { CONDITIONS } from './conditions';
import { hasTiles, TILE_KEYS, TILE_SOURCES, TILES, tileItems, type TileItem } from './conditionTiles';

const all: { cond: string; country: string; tile: string; item: TileItem }[] = [];
for (const [cond, byCountry] of Object.entries(TILES)) for (const [country, tiles] of Object.entries(byCountry)) for (const [tile, items] of Object.entries(tiles ?? {})) for (const item of items ?? []) all.push({ cond, country, tile, item });
const norm = (s: string) => s.toLowerCase().replace(/[’']/g, "'").replace(/[–—]/g, '-');

describe('condition tiles: every item is sourced', () => {
  it('has items, and ids are unique', () => {
    expect(all.length).toBeGreaterThan(40);
    expect(new Set(all.map((a) => a.item.id)).size).toBe(all.length);
  });
  it('every item names a source of its own country, with a link, a check date and an https official page', () => {
    for (const { country, item } of all) {
      const s = TILE_SOURCES[item.src];
      expect(s, item.id).toBeTruthy();
      expect(s.country, item.id).toBe(country);
      expect(s.url.startsWith('https://'), item.id).toBe(true);
      expect(['government', 'provincial_government']).toContain(s.type);
      expect(s.checkedOn, item.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
  it('every item has at least one quote: complete (no ellipsis), at most 125 characters, no dose amounts', () => {
    for (const { item } of all) {
      expect(item.quotes.length, item.id).toBeGreaterThan(0);
      for (const q of item.quotes) {
        expect(q.trim().length, item.id).toBeGreaterThan(8);
        expect(q.length, `${item.id}: ${q}`).toBeLessThanOrEqual(125);
        expect(q, item.id).not.toMatch(/\.\.\.|…/);
        expect(q, item.id).not.toMatch(/\b\d+(\.\d+)?\s?(mg|mcg|µg|ml)\b/i);
      }
    }
  });
  it('the title only names what the quote names (every word of 4 or more letters is in the quotes)', () => {
    for (const { item } of all) {
      const text = norm(item.quotes.join(' '));
      for (const w of norm(item.title).split(/[^a-z0-9]+/).filter((x) => x.length >= 4)) expect(text, `${item.id}: ${w}`).toContain(w);
    }
  });
  it('"avoid" items use the page\'s own word avoid; the others do not', () => {
    for (const { tile, item } of all) {
      const has = /\bavoid/i.test(item.quotes.join(' '));
      if (tile === 'avoid') expect(has, item.id).toBe(true);
      if (tile === 'moderate') expect(has, item.id).toBe(false);
    }
  });
  it('medicine links point at real medicines, and no tile carries a good/bad label or a home remedy we added ourselves', () => {
    for (const { item } of all) {
      for (const m of item.medIds ?? []) expect(MED_LIST.some((x) => x.med_id === m), `${item.id}: ${m}`).toBe(true);
      expect(item.title + item.quotes.join(' '), item.id).not.toMatch(/\b(turmeric|herbal|lemon|ginger|superfood|detox|miracle)\b/i);
      expect(item.title, item.id).not.toMatch(/\b(safe|unsafe|healthy|unhealthy|good|bad|best|worst)\b/i);
    }
  });
  it('tiles belong to known conditions and tile names', () => {
    const ids = CONDITIONS.map((c) => c.id);
    for (const cond of Object.keys(TILES)) expect(ids).toContain(cond);
    for (const { tile } of all) expect(TILE_KEYS as string[]).toContain(tile);
  });
});

describe('batch 1 coverage', () => {
  it('Chronic kidney disease, Gout and High blood pressure are checked for all three countries', () => {
    for (const c of ['ckd', 'gout', 'hbp'] as const) for (const k of ['US', 'GB', 'CA'] as const) expect(hasTiles(c, k), `${c} ${k}`).toBe(true);
  });
  it('a checked country with nothing found has empty tiles, never a stand-in from another country', () => {
    for (const t of TILE_KEYS) expect(tileItems('hbp', 'CA', t)).toEqual([]);
    expect(hasTiles('diabetes', 'CA')).toBe(false);
  });
  it('home remedy tiles list only what the page says to do at home', () => {
    for (const { tile, item } of all.filter((a) => a.tile === 'home')) expect(item.quotes.join(' '), item.id).toMatch(/ice|rest|raise|prop|elevat|cool|water|bedclothes|cold/i);
  });
});
