import { describe, expect, it } from 'vitest';
import { isExpired } from './inactivity';

describe('isExpired', () => {
  it('false before limit', () => expect(isExpired(0, 14 * 60_000, 15)).toBe(false));
  it('true at limit', () => expect(isExpired(0, 15 * 60_000, 15)).toBe(true));
});
