// Where emailed links (sign-up confirmation, password reset) and social sign-in should send the person back to.
// EXPO_PUBLIC_SITE_URL wins when set (production: https://health.carciente.ca). Otherwise the page's own origin on web,
// which is http://localhost:8081 under `expo start --web`. Phone apps have no web origin, so they return undefined.
export function resolveSiteUrl(env: string | undefined, origin: string | undefined): string | undefined {
  const raw = (env ?? '').trim() || origin || '';
  const v = raw.replace(/\/+$/, '');
  if (!v) return undefined;
  let u: URL;
  try { u = new URL(v); } catch { return undefined; }
  const local = u.hostname === 'localhost' || u.hostname === '127.0.0.1';
  if (u.protocol !== 'https:' && !(local && u.protocol === 'http:')) return undefined; // https only, except local development
  return u.origin;
}

// True when this page was opened from a password-reset email link (the link puts type=recovery in the URL hash).
// Read once, before supabase-js clears the hash.
export const hashIsRecovery = (hash: string) => /(^|[#&])type=recovery(&|$)/.test(hash);
