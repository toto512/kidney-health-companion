// Pure helpers for the delete-account function, kept free of Deno APIs so the app's test suite can run them.

export const DEFAULT_ORIGINS = ['https://health.carciente.ca'];

// Returns the origin to echo in Access-Control-Allow-Origin, or null when the caller's origin is not ours.
// Any localhost port is allowed for development. Extra origins come from the ALLOWED_ORIGINS secret (comma separated).
export function corsOrigin(origin: string | null, extra: string | undefined): string | null {
  if (!origin) return null;
  const list = [...DEFAULT_ORIGINS, ...(extra ?? '').split(',').map((s) => s.trim()).filter(Boolean)];
  if (list.includes(origin)) return origin;
  return /^http:\/\/localhost:\d{2,5}$/.test(origin) ? origin : null;
}

// Reads the "aal" claim from a JWT. The gateway has already verified the signature; this only reads the claim.
export function aalFromJwt(jwt: string): string | null {
  try {
    const part = jwt.split('.')[1];
    const json = atob(part.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(part.length / 4) * 4, '='));
    const aal = (JSON.parse(json) as { aal?: unknown }).aal;
    return typeof aal === 'string' ? aal : null;
  } catch {
    return null;
  }
}

// Same rule as the database: a person with a verified authenticator must be signed in with it (aal2).
export const blockedByTwoStep = (aal: string | null, hasVerifiedFactor: boolean) => hasVerifiedFactor && aal !== 'aal2';

// The request must say "DELETE" in its body, so a stray call cannot delete an account.
export const confirmed = (body: unknown) => typeof body === 'object' && body !== null && (body as { confirm?: unknown }).confirm === 'DELETE';
