import { router } from 'expo-router';
import { useState } from 'react';
import { AuthScreen, BigButton, Body, Field, TextLink } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/i18n/I18nProvider';
import { formatRecoveryInput, isRecoveryCodeShape, redeemResult } from '@/lib/recovery';
import { supabase } from '@/lib/supabase';

// Lost authenticator: a recovery code turns two-step sign-in off so the person can get in and turn it on again.
export default function Recover() {
  const { refreshAal } = useAuth();
  const { t } = useI18n();
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setErr(''); setBusy(true);
    const { data, error } = await supabase.rpc('redeem_recovery_code', { p_code: code });
    const r = redeemResult(data, error);
    if (__DEV__ && error) console.log('[recover]', error.code, error.message);
    if (r === 'ok') {
      await refreshAal();
      router.replace('/feature/two-step');
    } else if (r === 'wrong') setErr(t('recover.wrong'));
    else if (r === 'locked') setErr(t('recover.locked'));
    else if (r === 'off') setErr(t('recover.off'));
    else setErr(t('recover.generic'));
    setBusy(false);
  }

  return (
    <AuthScreen title={t('recover.title')}>
      <Body>{t('recover.intro')}</Body>
      <Field label={t('recover.label')} value={code} onChangeText={(v) => setCode(formatRecoveryInput(v))} autoCapitalize="characters" autoCorrect={false} maxLength={11} />
      {err ? <Body tone="danger">{err}</Body> : null}
      <BigButton label={busy ? t('mfa.checking') : t('recover.use')} onPress={submit} disabled={busy || !isRecoveryCodeShape(code)} />
      <TextLink href="/mfa-verify" label={t('recover.back')} />
    </AuthScreen>
  );
}
