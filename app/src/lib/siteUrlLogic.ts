// Where emailed links (sign-up confirmation, password reset) and social sign-in should send the person back to.
// EXPO_PUBLIC_SITE_URL wins when set (production: https://health.carciente.ca). Otherwise the page's own origin on web,
// which is http://localhost:8081 under `expo start --web`. Phone apps have no web origin, so they return undefined.
// Development addresses: this computer, or a home or office network address (10.x, 172.16 to 31.x, 192.168.x, 169.254.x, or a .local name).
// Plain http is accepted only for these, never for a public address.
export function isLocalHost(hostname: string): boolean {
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]' || hostname.endsWith('.local')) return true;
  const m = /^(\d{1,3})\.(\d{1,3})\.\d{1,3}\.\d{1,3}$/.exec(hostname);
  if (!m) return false;
  const a = +m[1], b = +m[2];
  return a === 10 || a === 127 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 169 && b === 254);
}
const clean = (raw: string): URL | null => {
  const v = raw.replace(/\/+$/, '');
  if (!v) return null;
  try {
    const u = new URL(v);
    return u.protocol === 'https:' || (u.protocol === 'http:' && isLocalHost(u.hostname)) ? u : null; // https only, except local development
  } catch { return null; }
};
// EXPO_PUBLIC_SITE_URL wins when it is a real https address (production). When it is unset or only a local address, a page opened
// from a local or network address (for example http://192.168.148.118:8081 on a phone) returns to that same address. Otherwise
// Supabase falls back to its Site URL (localhost) and the phone cannot reach it. The address must also be in the Supabase redirect list.
export function resolveSiteUrl(env: string | undefined, origin: string | undefined): string | undefined {
  const configured = clean((env ?? '').trim());
  if (configured && !isLocalHost(configured.hostname)) return configured.origin;
  const page = clean((origin ?? '').trim());
  if (page && isLocalHost(page.hostname)) return page.origin;
  return configured?.origin ?? page?.origin;
}

// True when this page was opened from a password-reset email link (the link puts type=recovery in the URL hash).
// Read once, before supabase-js clears the hash.
export const hashIsRecovery = (hash: string) => /(^|[#&])type=recovery(&|$)/.test(hash);
