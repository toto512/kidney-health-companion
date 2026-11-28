// Social sign-in helpers. Pure functions here are unit tested; the Supabase call lives in the screens.
export type SocialProvider = 'google' | 'azure';

export const SOCIAL_LABELS: Record<SocialProvider, string> = { google: 'Google', azure: 'Microsoft' };

// Buttons show only for providers listed in EXPO_PUBLIC_SOCIAL_PROVIDERS (for example "google,azure"),
// so a provider that is not yet set up in Supabase never shows a button that fails.
export function enabledProviders(raw: string | undefined): SocialProvider[] {
  const wanted = (raw ?? '').split(',').map((s) => s.trim().toLowerCase());
  return (['google', 'azure'] as const).filter((p) => wanted.includes(p));
}

// Defence in depth on top of Supabase's own rule (it links identities by email only when the email is verified).
// A session from an outside provider without a confirmed email is refused.
export function isUnverifiedSocialUser(u: { email?: string | null; email_confirmed_at?: string | null; confirmed_at?: string | null; app_metadata?: { provider?: string } } | null | undefined): boolean {
  if (!u) return false;
  const provider = u.app_metadata?.provider;
  if (!provider || provider === 'email') return false;
  return !u.email || !(u.email_confirmed_at || u.confirmed_at);
}
