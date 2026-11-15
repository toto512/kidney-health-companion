import { router } from 'expo-router';
import { useState } from 'react';
import { AuthScreen, BigButton, Body, Field, TextLink } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { formatRecoveryInput, isRecoveryCodeShape, redeemResult } from '@/lib/recovery';
import { supabase } from '@/lib/supabase';

// Lost authenticator: a recovery code turns two-step sign-in off so the person can get in and turn it on again.
export default function Recover() {
  const { refreshAal } = useAuth();
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
    } else if (r === 'wrong') setErr('That code did not work. Check each letter and number, then try again.');
    else if (r === 'locked') setErr('Too many tries. Wait 15 minutes, then try again.');
    else if (r === 'off') setErr('Two-step sign-in is already off. Go back and sign in again.');
    else setErr('Something went wrong. Check your connection and try again.');
    setBusy(false);
  }

  return (
    <AuthScreen title="Use a recovery code">
      <Body>Type one of the recovery codes you saved when you turned on two-step sign-in. Each code works once. Using it turns two-step sign-in off, and you can turn it back on right after.</Body>
      <Field label="Recovery code" value={code} onChangeText={(t) => setCode(formatRecoveryInput(t))} autoCapitalize="characters" autoCorrect={false} maxLength={11} />
      {err ? <Body tone="danger">{err}</Body> : null}
      <BigButton label={busy ? 'Checking...' : 'Use this code'} onPress={submit} disabled={busy || !isRecoveryCodeShape(code)} />
      <TextLink href="/mfa-verify" label="Back to the 6-digit code" />
    </AuthScreen>
  );
}
