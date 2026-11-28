import { describe, expect, it } from 'vitest';
import { setFlash, takeFlash } from './flash';

describe('flash message', () => {
  it('is delivered once, then gone', () => {
    expect(takeFlash()).toBeNull();
    setFlash('Profile saved.');
    expect(takeFlash()).toBe('Profile saved.');
    expect(takeFlash()).toBeNull();
  });
});
