import { describe, expect, it } from 'vitest';
import { addItem, flagFor, MAX_PLATE_ITEMS, plateCheck, removeItem, worstFlag } from './plateCheck';
import { foodCheck } from './foodCheck';

describe('plateCheck', () => {
  it('flags come only from the sourced lines for the person\'s conditions', () => {
    const rows = plateCheck(['Banana', 'Dragon fruit'], ['ckd'], 'US');
    const banana = foodCheck('Banana', ['ckd'], 'US');
    expect(banana.length).toBeGreaterThan(0);
    expect(rows[0].flag).toBe(flagFor(banana.filter((l) => l.tile === 'avoid' || l.tile === 'moderate')));
    expect(rows[0].lines.every((l) => !!l.quote && !!l.source.url && !!l.source.checkedOn)).toBe(true);
  });
  it('a food no page names is "none", never an ok flag', () => {
    const rows = plateCheck(['Zzyzx root'], ['ckd'], 'US');
    expect(rows[0]).toEqual({ name: 'Zzyzx root', flag: 'none', lines: [] });
  });
  it('avoid beats limit beats none', () => {
    const line = (tile: string) => ({ tile }) as never;
    expect(flagFor([line('moderate'), line('avoid')])).toBe('avoid');
    expect(flagFor([line('moderate')])).toBe('limit');
    expect(flagFor([line('home')])).toBe('none');
    expect(flagFor([])).toBe('none');
  });
  it('worstFlag is the strictest of the plate', () => {
    expect(worstFlag([{ name: 'a', flag: 'none', lines: [] }, { name: 'b', flag: 'limit', lines: [] }])).toBe('limit');
    expect(worstFlag([])).toBe('none');
  });
  it('addItem ignores blanks and repeats and stops at the limit', () => {
    expect(addItem([], '  ')).toEqual([]);
    expect(addItem(['Rice'], 'rice')).toEqual(['Rice']);
    let items: string[] = [];
    for (let i = 0; i < MAX_PLATE_ITEMS + 3; i++) items = addItem(items, `Food ${i}`);
    expect(items).toHaveLength(MAX_PLATE_ITEMS);
    expect(removeItem(['a', 'b'], 'a')).toEqual(['b']);
  });
  it('no conditions or no country gives no lines', () => {
    expect(plateCheck(['Banana'], [], 'US')[0].flag).toBe('none');
  });
});
