import { describe, expect, it } from 'vitest';
import { FOODS, FOOD_GROUPS } from './foods';
import { foodIconName, GROUP_ICON, ICON_PATHS, SUB_ICON } from './foodIcons';

describe('food icons', () => {
  it('has an icon for every group', () => {
    for (const g of FOOD_GROUPS) expect(ICON_PATHS[GROUP_ICON[g]]).toMatch(/^M/);
  });
  it('every food resolves to a drawable icon', () => {
    for (const f of FOODS) expect(ICON_PATHS[foodIconName(f.group, f.sub)]).toMatch(/^M/);
  });
  it('maps only sub-groups that exist in the food list', () => {
    const subs = new Set(FOODS.map((f) => f.sub));
    for (const k of Object.keys(SUB_ICON)) expect(subs.has(k)).toBe(true);
  });
});
