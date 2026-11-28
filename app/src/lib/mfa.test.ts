import { describe, expect, it } from 'vitest';
import { mfaReady, needsMfaCode } from './mfa';

describe('optional two-step sign-in', () => {
  it('lets a password-only user (no authenticator) straight in', () => {
    expect(needsMfaCode(true, 'aal1', 'aal1')).toBe(false);
    expect(mfaReady(true, 'aal1', 'aal1')).toBe(true);
  });
  it('asks for a code when the user has an authenticator and has not passed it', () => {
    expect(needsMfaCode(true, 'aal1', 'aal2')).toBe(true);
    expect(mfaReady(true, 'aal1', 'aal2')).toBe(false);
  });
  it('is satisfied after the code is verified', () => {
    expect(needsMfaCode(true, 'aal2', 'aal2')).toBe(false);
    expect(mfaReady(true, 'aal2', 'aal2')).toBe(true);
  });
  it('waits while the level is unknown and does nothing without a session', () => {
    expect(needsMfaCode(true, null, null)).toBe(false);
    expect(mfaReady(true, null, null)).toBe(false);
    expect(needsMfaCode(false, null, null)).toBe(false);
    expect(mfaReady(false, 'aal1', 'aal1')).toBe(false);
  });
});
