import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Image, Linking, Pressable, ScrollView } from 'react-native';
import { BigButton, Body, DisclaimerFooter, Field, H1, Screen } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { normalizeSvgDataUri } from '@/lib/qr';
import { supabase } from '@/lib/supabase';

type F = { id: string; friendly_name?: string | null; created_at: string };

// Turn two-step sign-in on or off and manage authenticator apps. Two-step sign-in is optional.
export default function TwoStep() {
  const { refreshAal } = useAuth();
  const [factors, setFactors] = useState<F[]>([]);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmId, setConfirmId] = useState('');
  const [adding, setAdding] = useState<{ id: string; qr: string; secret: string; uri: string } | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');

  const load = useCallback(async () => {
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error || !data) { setErr('Could not read your authenticator apps. Try again.'); return; }
    setFactors(data.totp as F[]);
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function startAdd() {
    setErr(''); setMsg(''); setBusy(true);
    const { data: list } = await supabase.auth.mfa.listFactors();
    for (const f of (list?.all ?? []).filter((x) => x.status === 'unverified')) await supabase.auth.mfa.unenroll({ factorId: f.id });
    const label = name.trim() || `Authenticator ${new Date().toISOString().slice(0, 10)}`;
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: `${label} ${Date.now()}` });
    setBusy(false);
    if (error || !data) { setErr('Could not start setup. Try again.'); return; }
    setAdding({ id: data.id, qr: normalizeSvgDataUri(data.totp.qr_code), secret: data.totp.secret, uri: data.totp.uri });
  }

  async function confirmAdd() {
    if (!adding) return;
    setErr(''); setBusy(true);
    const ch = await supabase.auth.mfa.challenge({ factorId: adding.id });
    if (ch.error || !ch.data) { setBusy(false); setErr('Could not check the code. Try again.'); return; }
    const v = await supabase.auth.mfa.verify({ factorId: adding.id, challengeId: ch.data.id, code: code.trim() });
    setBusy(false);
    if (v.error) { setErr('That code did not work. Use the newest code from the new app.'); return; }
    setAdding(null); setCode(''); setName(''); setMsg(factors.length === 0 ? 'Two-step sign-in is turned on.' : 'New authenticator added.');
    await load();
    await refreshAal();
  }

  async function remove(id: string) {
    setErr(''); setMsg('');
    if (confirmId !== id) { setConfirmId(id); return; }
    setBusy(true);
    const { error } = await supabase.auth.mfa.unenroll({ factorId: id });
    setBusy(false); setConfirmId('');
    if (error) { setErr('Could not remove it. Try again.'); return; }
    setMsg(factors.length <= 1 ? 'Two-step sign-in is turned off. You now sign in with your email and password only.' : 'Authenticator removed.');
    await load();
    await refreshAal();
  }

  return (
    <ScrollView>
      <Screen>
        <H1>Two-step sign-in</H1>
        <Body>{factors.length === 0 ? 'Two-step sign-in is off. You sign in with your email and password only. Turn it on to also need a 6-digit code from an app on your phone each time you sign in.' : 'Two-step sign-in is on. Your authenticator app gives a 6-digit code each time you sign in. You can add a second app or phone as a spare.'}</Body>
        {factors.map((f) => (
          <Body key={f.id}>
            {(f.friendly_name ?? 'Authenticator').replace(/\s\d{10,}$/, '')}, added {new Date(f.created_at).toLocaleDateString()}
          </Body>
        ))}
        {factors.map((f) => (
          <BigButton key={`rm-${f.id}`} label={confirmId === f.id ? 'Tap again to remove' : (factors.length <= 1 ? 'Turn off two-step sign-in' : `Remove ${(f.friendly_name ?? 'Authenticator').replace(/\s\d{10,}$/, '')}`)} onPress={() => remove(f.id)} disabled={busy} />
        ))}
        {adding ? (
          <>
            <Body>Scan this with the new authenticator app, then type the 6-digit code it shows.</Body>
            <Image accessibilityLabel="Authenticator QR code" source={{ uri: adding.qr }} style={{ width: 220, height: 220 }} />
            <Pressable accessibilityRole="link" onPress={() => Linking.openURL(adding.uri)}>
              <Body>On this phone? Tap here to open your authenticator app.</Body>
            </Pressable>
            <Body>Or type this key into the app: {adding.secret.match(/.{1,4}/g)?.join(' ')}</Body>
            <Field label="6-digit code" value={code} onChangeText={setCode} keyboardType="number-pad" maxLength={6} />
            <BigButton label={busy ? 'Checking...' : 'Confirm new authenticator'} onPress={confirmAdd} disabled={busy || code.length !== 6} />
            <BigButton label="Cancel" onPress={() => { setAdding(null); setCode(''); }} disabled={busy} />
          </>
        ) : (
          <>
            <Field label="Name for the authenticator (optional)" value={name} onChangeText={setName} maxLength={30} />
            <BigButton label={busy ? 'Starting...' : factors.length === 0 ? 'Turn on two-step sign-in' : 'Add another authenticator'} onPress={startAdd} disabled={busy} />
          </>
        )}
        {err ? <Body tone="danger">{err}</Body> : null}
        {msg ? <Body>{msg}</Body> : null}
        <BigButton label="Back to my profile" onPress={() => router.replace('/feature/profile')} />
        <DisclaimerFooter />
      </Screen>
    </ScrollView>
  );
}
