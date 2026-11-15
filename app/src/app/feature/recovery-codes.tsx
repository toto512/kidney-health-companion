import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { BigButton, Body, DisclaimerFooter, H1, Screen } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { font, space, useColors } from '@/theme/tokens';

// Recovery codes for two-step sign-in. New codes are shown once, here, and never again.
export default function RecoveryCodes() {
  const color = useColors();
  const [remaining, setRemaining] = useState<number | null>(null);
  const [codes, setCodes] = useState<string[] | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc('recovery_codes_remaining');
    if (!error && typeof data === 'number') setRemaining(data);
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function make() {
    if (remaining && remaining > 0 && !confirm) { setConfirm(true); return; }
    setErr(''); setBusy(true); setConfirm(false);
    const { data, error } = await supabase.rpc('generate_recovery_codes');
    setBusy(false);
    if (error || !Array.isArray(data)) {
      const m = error?.message ?? '';
      if (/two_step_off/.test(m)) setErr('Turn on two-step sign-in first, then make recovery codes.');
      else if (/aal2_required/.test(m)) setErr('Sign out and sign in again with your 6-digit code, then try again.');
      else setErr('Could not make the codes. Try again.');
      if (__DEV__ && error) console.log('[recovery-codes]', error.code, error.message);
      return;
    }
    setCodes(data as string[]);
    setRemaining((data as string[]).length);
  }

  return (
    <ScrollView>
      <Screen>
        <H1>Recovery codes</H1>
        {codes ? (
          <>
            <Body tone="danger">Write these codes down now. They are shown only once. Keep them somewhere safe, away from your phone. Each code works one time.</Body>
            <View style={{ backgroundColor: color.surface, borderColor: color.border, borderWidth: 1, borderRadius: 16, padding: space.m }}>
              {codes.map((c) => <Text key={c} selectable style={{ fontSize: font.h2, color: color.text, letterSpacing: 2, paddingVertical: 4 }}>{c}</Text>)}
            </View>
            <Body>Anyone who has your password and one of these codes can turn off two-step sign-in. Do not share them.</Body>
            <BigButton label="I have saved them" onPress={() => { setCodes(null); void load(); }} />
          </>
        ) : (
          <>
            <Body>If you lose your phone or authenticator app, a recovery code lets you sign in. Each code works once.</Body>
            <Body>{remaining === null ? '' : remaining > 0 ? `You have ${remaining} unused codes.` : 'You have no recovery codes yet.'}</Body>
            {confirm ? <Body tone="danger">Making new codes cancels the old ones. Tap again to continue.</Body> : null}
            <BigButton label={busy ? 'Making codes...' : remaining ? 'Make new codes' : 'Make recovery codes'} onPress={make} disabled={busy} />
            {err ? <Body tone="danger">{err}</Body> : null}
            <BigButton label="Back to two-step sign-in" onPress={() => router.replace('/feature/two-step')} />
          </>
        )}
        <DisclaimerFooter />
      </Screen>
    </ScrollView>
  );
}
