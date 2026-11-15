import { useEffect, useState } from 'react';
import { Image, Linking, Pressable } from 'react-native';
import { AuthScreen, BigButton, Body, Field } from '@/components/ui';
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
  const [busy, setBusy] = useState(false);

  // The real service error is shown only in development builds; it never contains health data.
  const fail = (msg: string, e?: { message?: string; code?: string } | null) =>
    setErr(__DEV__ && e ? `${msg} (${e.code ?? ''} ${e.message ?? ''})` : msg);

  // Dev only: report the gap between this computer's clock and the server's, since TOTP depends on both clocks.
  useEffect(() => {
    if (!__DEV__) return;
    fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/auth/v1/health`, { headers: { apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '' } })
      .then((r) => { const d = r.headers.get('date'); if (d) console.log(`[mfa] clock skew vs server: ${Math.round((Date.now() - new Date(d).getTime()) / 1000)}s`); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let live = true; // guards against a double mount enrolling twice and mixing up factor and QR
    (async () => {
      const { data: list, error: listErr } = await supabase.auth.mfa.listFactors();
      if (!live) return;
      if (listErr && (listErr.status === 401 || listErr.status === 403 || /user_not_found/i.test(`${(listErr as { code?: string }).code ?? ''} ${listErr.message}`))) {
        await supabase.auth.signOut({ scope: 'local' });
        return;
      }
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

  // Challenge is created at submit time (a challenge is short-lived), timed, and capped so the screen never hangs silently.
  async function verify() {
    setErr(''); setBusy(true);
    const t0 = Date.now();
    const withTimeout = <T,>(p: Promise<T>) =>
      Promise.race([p, new Promise<never>((_, rej) => setTimeout(() => rej(new Error('timeout after 15s')), 15000))]);
    try {
      const ch = await withTimeout(supabase.auth.mfa.challenge({ factorId }));
      const t1 = Date.now();
      if (ch.error || !ch.data) { fail('Could not check the code.', ch.error); return; }
      const v = await withTimeout(supabase.auth.mfa.verify({ factorId, challengeId: ch.data.id, code: code.trim() }));
      const t2 = Date.now();
      if (__DEV__) console.log(`[mfa] challenge ${t1 - t0}ms, verify ${t2 - t1}ms, error=${v.error?.code ?? 'none'} ${v.error?.message ?? ''}`);
      if (v.error) {
        // A repeat press after a successful verify returns 422; if the session is already aal2, just move on.
        const { data: lvl } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (lvl?.currentLevel === 'aal2') { await refreshAal(); return; }
        fail('That code did not work. Try the newest code from your authenticator app.', v.error); return;
      }
      await refreshAal();
    } catch (e) {
      fail('The check took too long. Check your connection and try again.', e as Error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthScreen title="Enter your 6-digit code">
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
        <BigButton label={busy ? 'Checking...' : 'Continue'} onPress={verify} disabled={busy || code.length !== 6 || !factorId} />
        {/* TODO(phase 2): email one-time code as backup factor; recovery flow. */}
    </AuthScreen>
  );
}
