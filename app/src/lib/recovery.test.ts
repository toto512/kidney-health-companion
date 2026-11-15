import { describe, expect, it } from 'vitest';
import { formatRecoveryInput, isRecoveryCodeShape, normalizeRecoveryCode, redeemResult } from './recovery';

describe('recovery code input', () => {
  it('treats spacing, hyphens and case as the same code', () => {
    expect(normalizeRecoveryCode(' abcde fghij ')).toBe('ABCDEFGHIJ');
    expect(normalizeRecoveryCode('ABCDE-FGHIJ')).toBe('ABCDEFGHIJ');
  });
  it('accepts exactly 10 characters', () => {
    expect(isRecoveryCodeShape('ABCDE-FGHIJ')).toBe(true);
    expect(isRecoveryCodeShape('ABCDE-FGHI')).toBe(false);
    expect(isRecoveryCodeShape('ABCDE-FGHIJK')).toBe(false);
  });
  it('formats as it is typed and stops at 10', () => {
    expect(formatRecoveryInput('abc')).toBe('ABC');
    expect(formatRecoveryInput('abcdefg')).toBe('ABCDE-FG');
    expect(formatRecoveryInput('abcdefghijklm')).toBe('ABCDE-FGHIJ');
  });
});

describe('redeemResult', () => {
  it('maps database outcomes', () => {
    expect(redeemResult(true, null)).toBe('ok');
    expect(redeemResult(false, null)).toBe('wrong');
    expect(redeemResult(null, { message: 'too_many_attempts' })).toBe('locked');
    expect(redeemResult(null, { message: 'two_step_off' })).toBe('off');
    expect(redeemResult(null, { message: 'boom' })).toBe('error');
  });
});
