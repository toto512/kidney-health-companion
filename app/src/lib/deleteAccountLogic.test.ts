import { describe, expect, it } from 'vitest';
import { aalFromJwt, blockedByTwoStep, confirmed, corsOrigin } from '../../../supabase/functions/delete-account/logic';

const jwt = (payload: object) => 'x.' + btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') + '.y';

describe('delete-account logic', () => {
  it('allows our site, localhost and listed extras only', () => {
    expect(corsOrigin('https://health.carciente.ca', undefined)).toBe('https://health.carciente.ca');
    expect(corsOrigin('http://localhost:8081', undefined)).toBe('http://localhost:8081');
    expect(corsOrigin('http://192.168.1.5:8081', undefined)).toBeNull();
    expect(corsOrigin('http://192.168.1.5:8081', 'http://192.168.1.5:8081, https://x.example')).toBe('http://192.168.1.5:8081');
    expect(corsOrigin('https://evil.example', undefined)).toBeNull();
    expect(corsOrigin('http://localhost:8081.evil.example', undefined)).toBeNull();
    expect(corsOrigin(null, undefined)).toBeNull();
  });
  it('reads the aal claim and tolerates junk', () => {
    expect(aalFromJwt(jwt({ aal: 'aal2' }))).toBe('aal2');
    expect(aalFromJwt(jwt({ aal: 'aal1' }))).toBe('aal1');
    expect(aalFromJwt(jwt({}))).toBeNull();
    expect(aalFromJwt('nonsense')).toBeNull();
  });
  it('blocks a person with a verified authenticator unless aal2', () => {
    expect(blockedByTwoStep('aal1', true)).toBe(true);
    expect(blockedByTwoStep(null, true)).toBe(true);
    expect(blockedByTwoStep('aal2', true)).toBe(false);
    expect(blockedByTwoStep('aal1', false)).toBe(false);
  });
  it('needs the exact word DELETE in the body', () => {
    expect(confirmed({ confirm: 'DELETE' })).toBe(true);
    for (const b of [null, {}, { confirm: 'delete' }, { confirm: true }, 'DELETE']) expect(confirmed(b)).toBe(false);
  });
});
