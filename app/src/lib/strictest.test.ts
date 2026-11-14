import { describe, expect, it } from 'vitest';
import { combineVerdicts } from './strictest';

describe('combineVerdicts', () => {
  it('not_allowed wins over allowed', () => expect(combineVerdicts(['allowed', 'not_allowed', 'allowed'])).toBe('not_allowed'));
  it('check wins over allowed', () => expect(combineVerdicts(['allowed', 'check'])).toBe('check'));
  it('no rules is check, not allowed', () => expect(combineVerdicts([])).toBe('check'));
});
