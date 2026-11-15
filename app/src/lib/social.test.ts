import { describe, expect, it } from 'vitest';
import { enabledProviders, isUnverifiedSocialUser } from './social';

describe('enabledProviders', () => {
  it('lists only known, configured providers', () => {
    expect(enabledProviders('google,azure')).toEqual(['google', 'azure']);
    expect(enabledProviders(' Azure , facebook')).toEqual(['azure']);
    expect(enabledProviders('')).toEqual([]);
    expect(enabledProviders(undefined)).toEqual([]);
  });
});

describe('isUnverifiedSocialUser', () => {
  it('ignores email and password users and missing users', () => {
    expect(isUnverifiedSocialUser(null)).toBe(false);
    expect(isUnverifiedSocialUser({ email: 'a@b.c', app_metadata: { provider: 'email' } })).toBe(false);
  });
  it('accepts a social user with a confirmed email', () => {
    expect(isUnverifiedSocialUser({ email: 'a@b.c', email_confirmed_at: '2026-11-15T00:00:00Z', app_metadata: { provider: 'google' } })).toBe(false);
  });
  it('refuses a social user with no email or no confirmation', () => {
    expect(isUnverifiedSocialUser({ email: null, app_metadata: { provider: 'azure' } })).toBe(true);
    expect(isUnverifiedSocialUser({ email: 'a@b.c', app_metadata: { provider: 'google' } })).toBe(true);
  });
});
