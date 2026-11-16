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

import { changedStrengths, customKey, listKey, normalizeStrength } from './medSelection';
describe('strength', () => {
  it('accepts the person\'s own text and cleans spaces', () => {
    expect(normalizeStrength(' 150  mcg ')).toEqual({ value: '150 mcg', error: null });
    expect(normalizeStrength('5 ml')).toEqual({ value: '5 ml', error: null });
    expect(normalizeStrength('2.5 mg/5 ml')).toEqual({ value: '2.5 mg/5 ml', error: null });
    expect(normalizeStrength('150 µg').value).toBe('150 µg');
  });
  it('treats empty as no strength', () => { expect(normalizeStrength('   ')).toEqual({ value: null, error: null }); });
  it('rejects long text and odd characters with a plain message', () => {
    expect(normalizeStrength('1'.repeat(41)).error).toContain('40 characters');
    expect(normalizeStrength('<b>5 mg</b>').error).toContain('simple marks');
    expect(normalizeStrength('5 mg; drop').error).toContain('simple marks');
  });
  it('keys list items and own names apart and finds changes', () => {
    expect(listKey('atorvastatin')).toBe('m:atorvastatin');
    expect(customKey('My Syrup')).toBe('c:my syrup');
    expect(changedStrengths({ 'm:a': '5 mg', 'm:b': '' }, { 'm:a': '10 mg', 'm:b': '' }, ['m:a', 'm:b'])).toEqual(['m:a']);
    expect(changedStrengths({}, { 'm:a': '' }, ['m:a'])).toEqual([]);
  });
});
