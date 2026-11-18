import { describe, expect, it } from 'vitest';
import { MED_LIST } from './medList';
import { CONDITIONS } from './conditions';
import { CONDITION_LIST } from './conditionList';
import { UNVERIFIED, PENDING_SOURCES, hasTiles, reviewDate, pageIsOld, hiddenAsOld, TILE_KEYS, TILE_SOURCES, TILES, tileItems, type TileItem } from './conditionTiles';

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
      // A remedy word is allowed only when the official quote itself says it (NHS common cold page names a hot lemon and honey drink).
      const remedy = /\b(turmeric|herbal|lemon|ginger|superfood|detox|miracle)\b/i;
      const quoted = remedy.test(item.quotes.join(' '));
      expect(quoted ? '' : item.title, item.id).not.toMatch(remedy);
      if (!item.id.startsWith('gb-cold-')) expect(item.quotes.join(' '), item.id).not.toMatch(remedy);
      expect(item.title, item.id).not.toMatch(/\b(safe|unsafe|healthy|unhealthy|good|bad|best|worst)\b/i);
    }
  });
  it('tiles belong to known conditions and tile names', () => {
    const ids = [...CONDITIONS.map((c) => c.id), ...CONDITION_LIST.map((c) => c.id)];
    for (const cond of Object.keys(TILES)) expect(ids).toContain(cond);
    for (const { tile } of all) expect(TILE_KEYS as string[]).toContain(tile);
  });
});

describe('food groups named by official pages', () => {
  const groups = all.flatMap(({ item }) => (item.foodGroups ?? []).map((g) => ({ id: item.id, country: item.src && TILE_SOURCES[item.src].country, g })));
  it('there are groups, each from an official source of the same country, with a short complete quote', () => {
    expect(groups.length).toBeGreaterThan(5);
    for (const { id, country, g } of groups) {
      const s = TILE_SOURCES[g.src];
      expect(s, id).toBeTruthy();
      expect(s.country, id).toBe(country);
      expect(g.quote.length, `${id}: ${g.quote}`).toBeLessThanOrEqual(125);
      expect(g.quote, id).not.toMatch(/\.\.\.|…/);
      expect(g.quote, id).not.toMatch(/\b\d+(\.\d+)?\s?(mg|mcg|g|ml)\b/i);
    }
  });
  it('every named food is in the quote itself, or (for a page list) the quote introduces a list', () => {
    for (const { id, g } of groups) {
      expect(g.foods.length, id).toBeGreaterThan(0);
      if (!g.list) for (const f of g.foods) expect(norm(g.quote), `${id}: ${f}`).toContain(norm(f));
      else expect(g.foods.length, id).toBeGreaterThan(1);
    }
  });
  it('no verdict wording: nothing says ok, safe, good or bad', () => {
    for (const { id, g } of groups) expect(g.quote + g.foods.join(' '), id).not.toMatch(/\b(ok|okay|safe|unsafe|healthy|unhealthy|good|bad)\b/i);
  });
  it('bananas, potatoes, dairy and meat are named for US kidney disease', () => {
    const foods = tileItems('ckd', 'US', 'moderate').flatMap((i) => (i.foodGroups ?? []).flatMap((g) => g.foods)).join(' | ').toLowerCase();
    for (const w of ['bananas', 'potatoes', 'dairy', 'meat', 'poultry', 'fish']) expect(foods).toContain(w);
  });
});

describe('batch 1 coverage', () => {
  it('Chronic kidney disease, Gout and High blood pressure are checked for all three countries', () => {
    for (const c of ['ckd', 'gout', 'hbp'] as const) for (const k of ['US', 'GB', 'CA'] as const) expect(hasTiles(c, k), `${c} ${k}`).toBe(true);
  });
  it('a checked country with nothing found has empty tiles, never a stand-in from another country', () => {
    for (const t of TILE_KEYS) expect(tileItems('hbp', 'CA', t)).toEqual([]);
    expect(hasTiles('scoliosis', 'CA')).toBe(false);
  });
  it('home remedy tiles list only what the page says to do at home', () => {
    for (const { item } of all.filter((a) => a.tile === 'home' && ['ckd', 'gout', 'hbp'].includes(a.cond))) expect(item.quotes.join(' '), item.id).toMatch(/ice|rest|raise|prop|elevat|cool|water|bedclothes|cold/i);
  });
});

describe('unverified items', () => {
  it('hidden ids exist, and none is returned by tileItems', () => {
    for (const id of UNVERIFIED) {
      expect(all.some((a) => a.item.id === id.split('@')[0]), id).toBe(true);
      for (const { cond, country, tile } of all) expect(tileItems(cond, country as 'US', tile as 'avoid').some((i) => i.id === id)).toBe(false);
    }
  });
});

describe('batch 2 coverage', () => {
  it('Diabetes and Heart disease are checked for all three countries', () => {
    for (const c of ['diabetes', 'heart'] as const) for (const k of ['US', 'GB', 'CA'] as const) expect(hasTiles(c, k), `${c} ${k}`).toBe(true);
  });
});

describe('old-page rule (medicines on pages reviewed more than 5 years ago)', () => {
  const now = new Date(Date.UTC(2026, 10, 18));
  it('reads review dates in every format the sources use', () => {
    expect(reviewDate('Last Reviewed October 2016')?.toISOString().slice(0, 10)).toBe('2016-10-31');
    expect(reviewDate('Current as of: March 1, 2023')?.toISOString().slice(0, 10)).toBe('2023-03-01');
    expect(reviewDate('Adaptation Date: 6/14/2023')?.toISOString().slice(0, 10)).toBe('2023-06-14');
    expect(reviewDate('Page last reviewed: 22 March 2023')?.toISOString().slice(0, 10)).toBe('2023-03-22');
    expect(reviewDate('Last updated on December 27, 2024')?.toISOString().slice(0, 10)).toBe('2024-12-27');
    expect(reviewDate(null)).toBeNull();
  });
  it('every dated source has a readable date', () => {
    for (const [id, s] of Object.entries(TILE_SOURCES)) if (s.dateText) expect(reviewDate(s.dateText), id).not.toBeNull();
  });
  it('pages with no date are never old', () => {
    for (const [id, s] of Object.entries(TILE_SOURCES)) if (!s.dateText) expect(pageIsOld(id, now), id).toBe(false);
  });
  it('hides medicine items only, only on old pages', () => {
    const med = { id: 'x', title: 't', quotes: ['q'], src: 'us-niddk-ckd-manage', medIds: ['m'] } as TileItem;
    const plain = { id: 'y', title: 't', quotes: ['q'], src: 'us-niddk-ckd-manage' } as TileItem;
    const fresh = { id: 'z', title: 't', quotes: ['q'], src: 'uk-diabetes', medIds: ['m'] } as TileItem;
    expect(hiddenAsOld(med, 'home', now)).toBe(true);
    expect(hiddenAsOld(plain, 'meds', now)).toBe(true);
    expect(hiddenAsOld(plain, 'activity', now)).toBe(false);
    expect(hiddenAsOld(fresh, 'meds', now)).toBe(false);
  });
  it('no visible Medicines item comes from a page older than 5 years today', () => {
    for (const c of Object.keys(TILES)) for (const k of ['US', 'GB', 'CA'] as const) for (const key of TILE_KEYS) for (const i of tileItems(c, k, key)) {
      if (key === 'meds' || i.medIds?.length) expect(pageIsOld(i.src), i.id).toBe(false);
    }
  });
});

describe('pending sources (new, not yet confirmed by the verify script)', () => {
  it('exist, and nothing from them is returned by tileItems', () => {
    for (const id of PENDING_SOURCES) expect(TILE_SOURCES[id], id).toBeTruthy();
    for (const c of Object.keys(TILES)) for (const k of ['US', 'GB', 'CA'] as const) for (const key of TILE_KEYS) for (const i of tileItems(c, k, key)) expect(PENDING_SOURCES, i.id).not.toContain(i.src);
  });
});
