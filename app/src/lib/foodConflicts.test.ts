import { describe, expect, it } from 'vitest';
import { foodKey, foodsIn, stricterElsewhere } from './foodConflicts';
import { TILES } from '../content/conditionTiles';

describe('food conflicts across several conditions', () => {
  it('matches singular, plural and bracketed names', () => {
    expect(foodKey('Bananas')).toBe(foodKey('banana'));
    expect(foodKey('broccoli (cooked)')).toBe('broccoli');
    expect(foodKey('Cheese')).toBe('cheese');
  });
  it('flags a food that is limited in one condition and avoided in another, and never the other way round', () => {
    const avoid = [...foodsIn('ckd', 'CA', 'avoid')];
    expect(avoid.length).toBeGreaterThan(3);
    const food = 'salt substitutes';
    expect(foodsIn('ckd', 'CA', 'moderate').has(foodKey(food))).toBe(true);
    // CKD (Canada) names salt substitutes under moderation and under avoid, so a condition limiting them is not stricter than CKD's avoid line.
    const flagged = stricterElsewhere([food], 'moderate', 'hbp', [{ id: 'ckd', label: 'Chronic kidney disease' }, { id: 'hbp', label: 'High blood pressure' }], 'CA');
    expect(flagged).toEqual([{ food, conditions: ['Chronic kidney disease'] }]);
    expect(stricterElsewhere([food], 'avoid', 'ckd', [{ id: 'hbp', label: 'High blood pressure' }], 'CA')).toEqual([]);
  });
  it('never flags a food against the same condition or an unrelated food', () => {
    expect(stricterElsewhere(['salt substitutes'], 'moderate', 'ckd', [{ id: 'ckd', label: 'x' }], 'CA')).toEqual([]);
    expect(stricterElsewhere(['zzzz'], 'moderate', 'hbp', [{ id: 'ckd', label: 'x' }], 'CA')).toEqual([]);
    expect(Object.keys(TILES).length).toBeGreaterThan(10);
  });
});
