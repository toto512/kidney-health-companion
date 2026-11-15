import { describe, expect, it } from 'vitest';
import { hashIsRecovery, resolveSiteUrl } from './siteUrlLogic';

describe('resolveSiteUrl', () => {
  it('prefers the env value and drops trailing slashes and paths', () => {
    expect(resolveSiteUrl('https://health.carciente.ca/', 'http://localhost:8081')).toBe('https://health.carciente.ca');
  });
  it('falls back to the page origin in development', () => {
    expect(resolveSiteUrl(undefined, 'http://localhost:8081')).toBe('http://localhost:8081');
    expect(resolveSiteUrl('', 'http://localhost:8081')).toBe('http://localhost:8081');
  });
  it('refuses plain http outside localhost and junk values', () => {
    expect(resolveSiteUrl('http://example.com', undefined)).toBeUndefined();
    expect(resolveSiteUrl('not a url', undefined)).toBeUndefined();
    expect(resolveSiteUrl(undefined, undefined)).toBeUndefined();
  });
});

describe('hashIsRecovery', () => {
  it('detects a reset link and ignores other links', () => {
    expect(hashIsRecovery('#access_token=abc&refresh_token=x&type=recovery')).toBe(true);
    expect(hashIsRecovery('#type=recovery&access_token=abc')).toBe(true);
    expect(hashIsRecovery('#access_token=abc&type=signup')).toBe(false);
    expect(hashIsRecovery('#error=access_denied&error_code=otp_expired')).toBe(false);
    expect(hashIsRecovery('')).toBe(false);
  });
});
