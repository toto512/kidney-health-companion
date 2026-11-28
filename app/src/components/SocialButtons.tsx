import { useState } from 'react';
import { Platform, Text, View } from 'react-native';
import { BigButton, Body } from '@/components/ui';
import { useI18n } from '@/i18n/I18nProvider';
import { enabledProviders, SOCIAL_LABELS, SocialProvider } from '@/lib/social';
import { siteUrl } from '@/lib/siteUrl';
import { supabase } from '@/lib/supabase';
import { font, useColors } from '@/theme/tokens';

const PROVIDERS = enabledProviders(process.env.EXPO_PUBLIC_SOCIAL_PROVIDERS);

// Web only for now. Native phone apps need deep-link handling (Phase 5), so no buttons are shown there.
export function SocialButtons({ verb }: { verb: 'Sign in' | 'Sign up' }) {
  const color = useColors();
  const { t } = useI18n();
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  if (Platform.OS !== 'web' || PROVIDERS.length === 0) return null;

  async function go(provider: SocialProvider) {
    setErr(''); setBusy(true);
    const redirectTo = siteUrl();
    if (__DEV__) console.info('[social sign-in] redirectTo =', redirectTo ?? '(none)'); // address only, no tokens; shows in the browser console while developing
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo, scopes: provider === 'azure' ? 'email' : undefined },
    });
    if (error) { setErr(t('auth.socialErr', { provider: SOCIAL_LABELS[provider] })); setBusy(false); }
  }

  return (
    <View style={{ gap: 12 }}>
      <Text style={{ textAlign: 'center', color: color.muted, fontSize: font.body }}>{t('auth.or')}</Text>
      {PROVIDERS.map((p) => (
        <BigButton key={p} variant="secondary" label={t(verb === 'Sign in' ? 'auth.signInWith' : 'auth.signUpWith', { provider: SOCIAL_LABELS[p] })} disabled={busy} onPress={() => go(p)} />
      ))}
      {err ? <Body tone="danger">{err}</Body> : null}
    </View>
  );
}
