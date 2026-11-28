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
  it('a page opened by a network address returns to that address, even when the env value says localhost', () => {
    expect(resolveSiteUrl('http://localhost:8081', 'http://192.168.148.118:8081')).toBe('http://192.168.148.118:8081');
    expect(resolveSiteUrl(undefined, 'http://192.168.148.118:8081')).toBe('http://192.168.148.118:8081');
    expect(resolveSiteUrl('https://health.carciente.ca', 'http://10.0.0.5:8081')).toBe('https://health.carciente.ca'); // a real https setting still wins
    expect(resolveSiteUrl(undefined, 'http://172.20.1.2:8081')).toBe('http://172.20.1.2:8081');
    expect(resolveSiteUrl(undefined, 'http://my-pc.local:8081')).toBe('http://my-pc.local:8081');
  });
  it('the live site keeps using its own https address', () => {
    expect(resolveSiteUrl('https://health.carciente.ca', 'https://health.carciente.ca')).toBe('https://health.carciente.ca');
    expect(resolveSiteUrl(undefined, 'https://health.carciente.ca')).toBe('https://health.carciente.ca');
  });
  it('public http addresses are never accepted', () => {
    for (const o of ['http://8.8.8.8:8081', 'http://172.32.0.1', 'http://192.169.1.1', 'http://example.com', 'http://192.168.1.1.evil.com']) expect(resolveSiteUrl(undefined, o), o).toBeUndefined();
    expect(resolveSiteUrl('http://example.com', 'http://8.8.8.8')).toBeUndefined();
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
