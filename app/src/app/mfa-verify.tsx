import { useEffect, useState } from 'react';
import { Image, ScrollView } from 'react-native';
import { BigButton, Body, Field, H1, Screen } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

// Enrols a TOTP factor if none is verified yet, otherwise challenges the existing one.
export default function MfaVerify() {
  const { refreshAal } = useAuth();
  const [factorId, setFactorId] = useState('');
  const [qr, setQr] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    (async () => {
      const { data: list } = await supabase.auth.mfa.listFactors();
      const verified = list?.totp?.[0];
      if (verified) { setFactorId(verified.id); return; }
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
      if (error || !data) { setErr('Could not start authenticator setup.'); return; }
      setFactorId(data.id); setQr(data.totp.qr_code); setSecret(data.totp.secret);
    })();
  }, []);

  async function verify() {
    setErr('');
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code: code.trim() });
    if (error) { setErr('That code did not work. Try the newest code from your authenticator app.'); return; }
    await refreshAal();
  }

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <Screen>
        <H1>Enter your 6-digit code</H1>
        {qr ? (
          <>
            <Body>Scan this with an authenticator app, then type the code it shows.</Body>
            <Image accessibilityLabel="Authenticator QR code" source={{ uri: qr }} style={{ width: 220, height: 220 }} />
            <Body>Or type this key into the app: {secret}</Body>
          </>
        ) : null}
        <Field label="6-digit code" value={code} onChangeText={setCode} keyboardType="number-pad" maxLength={6} />
        {err ? <Body tone="danger">{err}</Body> : null}
        <BigButton label="Continue" onPress={verify} disabled={code.length !== 6 || !factorId} />
        {/* TODO(phase 2): email one-time code as backup factor; recovery flow. */}
      </Screen>
    </ScrollView>
  );
}
