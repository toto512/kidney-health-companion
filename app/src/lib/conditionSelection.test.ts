import { describe, expect, it } from 'vitest';
import { diffSelection, knownIds, toggleId } from './conditionSelection';

describe('condition selection', () => {
  it('toggles an id on and off', () => {
    expect(toggleId(['a'], 'b')).toEqual(['a', 'b']);
    expect(toggleId(['a', 'b'], 'a')).toEqual(['b']);
  });
  it('diffs saved against wanted', () => {
    expect(diffSelection(['a', 'b'], ['b', 'c'])).toEqual({ add: ['c'], remove: ['a'] });
    expect(diffSelection([], [])).toEqual({ add: [], remove: [] });
    expect(diffSelection(['a'], ['a', 'a'])).toEqual({ add: [], remove: [] });
  });
  it('drops unknown and duplicate ids', () => {
    expect(knownIds(['a', 'zz', 'a', 'b'], ['a', 'b'])).toEqual(['a', 'b']);
  });
});
