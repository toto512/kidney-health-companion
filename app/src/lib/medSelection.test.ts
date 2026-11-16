import { describe, expect, it } from 'vitest';
import { addCustom, diffCustom, normalizeCustomName } from './medSelection';

describe('medicine selection', () => {
  it('normalizes a custom name', () => {
    expect(normalizeCustomName('  My   vitamin  ')).toBe('My vitamin');
    expect(normalizeCustomName('   ')).toBeNull();
    expect(normalizeCustomName('a'.repeat(101))).toBeNull();
    expect(normalizeCustomName('a'.repeat(100))).toHaveLength(100);
  });
  it('adds a custom name once, ignoring case, with plain errors', () => {
    expect(addCustom([], 'Fish oil')).toEqual({ list: ['Fish oil'], error: null });
    expect(addCustom(['Fish oil'], 'FISH  OIL').error).toBe('That name is already on your list.');
    expect(addCustom([], '  ').error).toBe('Type a name first.');
    expect(addCustom([], 'x'.repeat(101)).error).toContain('100 characters');
  });
  it('diffs custom names ignoring case', () => {
    expect(diffCustom(['Fish oil', 'Zinc'], ['fish oil', 'Iron'])).toEqual({ add: ['Iron'], remove: ['Zinc'] });
  });
});
