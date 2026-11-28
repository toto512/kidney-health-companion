import { describe, expect, it } from 'vitest';
import { cardsFor, officialId } from './conditionIds';

describe('conditions screen cards', () => {
  it('maps picker ids to the official ids', () => {
    expect(officialId('hypertension')).toBe('hbp');
    expect(officialId('type-2-diabetes')).toBe('diabetes');
    expect(officialId('ckd')).toBe('ckd');
  });
  it('every picked condition gets one card, in order, and shared official content shows once', () => {
    const c = cardsFor(['stroke', 'ischemic-heart-disease', 'coronary-artery-disease', 'ckd']);
    expect(c.map((x) => x.officialId)).toEqual(['stroke', 'heart', 'ckd']);
    expect(c[0].label).toBe('Stroke');
  });
  it('nothing picked gives no cards (the screen then falls back to the five official ones)', () => {
    expect(cardsFor([])).toEqual([]);
  });
});
