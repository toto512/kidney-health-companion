import { useEffect, useState } from 'react';
import { Image, Linking, Pressable, ScrollView } from 'react-native';
import { BigButton, Body, Field, H1, Screen } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { normalizeSvgDataUri } from '@/lib/qr';
import { supabase } from '@/lib/supabase';

// Enrols a TOTP factor if none is verified yet, otherwise challenges the existing one.
export default function MfaVerify() {
  const { refreshAal } = useAuth();
  const [factorId, setFactorId] = useState('');
  const [qr, setQr] = useState('');
  const [secret, setSecret] = useState('');
  const [uri, setUri] = useState('');
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');

  // The real service error is shown only in development builds; it never contains health data.
  const fail = (msg: string, e?: { message?: string; code?: string } | null) =>
    setErr(__DEV__ && e ? `${msg} (${e.code ?? ''} ${e.message ?? ''})` : msg);

  useEffect(() => {
    let live = true; // guards against a double mount enrolling twice and mixing up factor and QR
    (async () => {
      const { data: list, error: listErr } = await supabase.auth.mfa.listFactors();
      if (!live) return;
      if (listErr || !list) { fail('Could not read your authenticator settings.', listErr); return; }
      const verified = list.totp?.[0];
      if (verified) { setFactorId(verified.id); return; }
      // Leftover unverified factors from earlier attempts can block a new enrolment, so clear them first.
      for (const f of list.all.filter((x) => x.status === 'unverified')) await supabase.auth.mfa.unenroll({ factorId: f.id });
      if (!live) return;
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: `Authenticator ${Date.now()}` });
      if (!live) return;
      if (error || !data) { fail('Could not start authenticator setup.', error); return; }
      setFactorId(data.id); setQr(normalizeSvgDataUri(data.totp.qr_code)); setSecret(data.totp.secret); setUri(data.totp.uri);
    })();
    return () => { live = false; };
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
            <Body>Set up an authenticator app, then type the 6-digit code it shows. Any one of the three ways below works.</Body>
            <Image accessibilityLabel="Authenticator QR code" source={{ uri: qr }} style={{ width: 220, height: 220 }} />
            <Pressable accessibilityRole="link" onPress={() => Linking.openURL(uri)}>
              <Body>On this phone? Tap here to open your authenticator app.</Body>
            </Pressable>
            <Body>Or type this key into the app: {secret.match(/.{1,4}/g)?.join(' ')}</Body>
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
