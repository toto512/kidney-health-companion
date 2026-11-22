import { describe, expect, it } from 'vitest';
import { FOODS } from './foods';
import { foodIcon, GROUP_ICON, ICON_SVG, SUB_ICON, TILE_ICON } from './foodIcons';

describe('food icons', () => {
  it('every food and group resolves to a shipped SVG', () => {
    for (const f of FOODS) expect(ICON_SVG[foodIcon(f).key]).toMatch(/^<svg/);
    for (const k of [...Object.values(GROUP_ICON), ...Object.values(TILE_ICON), ...Object.values(SUB_ICON)]) expect(ICON_SVG[k]).toMatch(/^<svg/);
  });
  it('maps only sub-groups that exist in the food list', () => {
    const subs = new Set(FOODS.map((f) => f.sub));
    for (const k of Object.keys(SUB_ICON)) expect(subs.has(k)).toBe(true);
  });
  it('does not stretch a picture to a different food', () => {
    const key = (name: string) => foodIcon(FOODS.find((f) => f.name === name)!).key;
    expect(key('Pears')).toBe('1f350');
    expect(key('Apples')).toBe('1f34e');
    expect(key('Bananas')).toBe('1f34c');
    expect(key('Tomatillos')).not.toBe(key('Tomatoes'));
    expect(key('Lemons')).not.toBe(key('Oranges'));
  });
  it('SVGs are self-contained (no external references)', () => {
    for (const s of Object.values(ICON_SVG)) expect(s).not.toMatch(/https?:\/\/(?!www\.w3\.org)/);
  });
  it('reports coverage', () => {
    const c = { food: 0, 'sub-group': 0, group: 0 };
    for (const f of FOODS) c[foodIcon(f).level]++;
    expect(c.food).toBeGreaterThan(200);
  });
});
