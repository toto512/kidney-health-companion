import { describe, expect, it } from 'vitest';
import { findDuplicate, signature, type SavedReport } from './labDuplicate';

const saved: SavedReport[] = [
  { id: 'a', taken_on: '2026-10-20', results: [{ test: 'creatinine', value: 96, unit: 'umol/L' }, { test: 'sodium', value: 140, unit: 'mmol/L' }, { test: 'potassium', value: 4.4, unit: 'mmol/L' }] },
  { id: 'b', taken_on: '2026-09-01', results: [{ test: 'sodium', value: 139, unit: 'mmol/L' }] },
];
const v = (test: string, value: number, unit = 'mmol/L') => ({ test, value, unit });

describe('findDuplicate', () => {
  it('finds the same date with the same values', () => {
    expect(findDuplicate(saved, '2026-10-20', [v('creatinine', 96, 'umol/L'), v('sodium', 140), v('potassium', 4.4)])?.id).toBe('a');
  });
  it('finds it when the new set is part of a saved report', () => expect(findDuplicate(saved, '2026-10-20', [v('sodium', 140)])?.id).toBe('a'));
  it('ignores order', () => expect(findDuplicate(saved, '2026-10-20', [v('potassium', 4.4), v('sodium', 140)])?.id).toBe('a'));
  it('is not a duplicate on another date', () => expect(findDuplicate(saved, '2026-10-21', [v('sodium', 140)])).toBeNull());
  it('is not a duplicate when one value differs', () => expect(findDuplicate(saved, '2026-10-20', [v('sodium', 140), v('potassium', 4.5)])).toBeNull());
  it('is not a duplicate when the unit differs', () => expect(findDuplicate(saved, '2026-10-20', [v('creatinine', 96, 'mg/dL')])).toBeNull());
  it('is not a duplicate when the new report has an extra test', () => expect(findDuplicate(saved, '2026-10-20', [v('sodium', 140), v('urea', 6.1)])).toBeNull());
  it('treats numeric strings from the database as numbers', () => {
    expect(findDuplicate([{ id: 'c', taken_on: '2026-10-20', results: [{ test: 'sodium', value: '140.0' as unknown as number, unit: 'mmol/L' }] }], '2026-10-20', [v('sodium', 140)])?.id).toBe('c');
  });
  it('never flags an empty set or an empty history', () => { expect(findDuplicate(saved, '2026-10-20', [])).toBeNull(); expect(findDuplicate([], '2026-10-20', [v('sodium', 140)])).toBeNull(); });
});

describe('signature', () => {
  it('is the same regardless of order and changes with any value or date', () => {
    expect(signature('2026-10-20', [v('a', 1), v('b', 2)])).toBe(signature('2026-10-20', [v('b', 2), v('a', 1)]));
    expect(signature('2026-10-20', [v('a', 1)])).not.toBe(signature('2026-10-21', [v('a', 1)]));
    expect(signature('2026-10-20', [v('a', 1)])).not.toBe(signature('2026-10-20', [v('a', 2)]));
  });
});
