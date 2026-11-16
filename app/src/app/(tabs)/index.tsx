import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Card, CardNote, CardValue, DisclaimerFooter, H1, H2, Screen, Suggestion } from '@/components/ui';
import { TrackingSuggestions } from '@/components/TrackingSuggestions';
import { useAuth } from '@/lib/auth';
import { dismiss, wasDismissed } from '@/lib/suggestions';
import { takeFlash } from '@/lib/flash';
import { supabase } from '@/lib/supabase';
import { font, space, useColors } from '@/theme/tokens';

type Latest = { systolic: number; diastolic: number; taken_at: string } | null | 'error';

export default function Today() {
  const [bp, setBp] = useState<Latest>(null);
  const [loaded, setLoaded] = useState(false);
  const color = useColors();
  const { session, aal, needsMfa } = useAuth();
  const uid = session?.user.id;
  const [tipGone, setTipGone] = useState(true); // hidden until we know it was not dismissed
  useEffect(() => { if (uid) void wasDismissed('two-step', uid).then(setTipGone); }, [uid]);
  const showTip = !tipGone && aal === 'aal1' && !needsMfa;
  const [flash, setFlashMsg] = useState<string | null>(null);

  // A confirmation from the screen the person just came from (for example "Profile saved."), shown for 6 seconds.
  useFocusEffect(useCallback(() => {
    const m = takeFlash();
    if (m) setFlashMsg(m);
  }, []));
  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlashMsg(null), 6000);
    return () => clearTimeout(t);
  }, [flash]);

  useFocusEffect(useCallback(() => {
    let alive = true;
    supabase.from('bp_readings').select('systolic,diastolic,taken_at').order('taken_at', { ascending: false }).limit(1)
      .then(({ data, error }) => {
        if (!alive) return;
        setBp(error ? 'error' : (data?.[0] ?? null));
        setLoaded(true);
      });
    return () => { alive = false; };
  }, []));

  return (
    <ScrollView>
      <Screen>
        <H1>Today</H1>
        {flash ? (
          <Pressable accessibilityRole="alert" accessibilityLiveRegion="polite" accessibilityLabel={`${flash} Tap to dismiss.`} onPress={() => setFlashMsg(null)}
            style={{ backgroundColor: color.primaryTint, borderColor: color.primary, borderWidth: 2, borderRadius: 16, padding: space.m, minHeight: 56, justifyContent: 'center' }}>
            <Text style={{ fontSize: font.label, color: color.text, fontWeight: '600' }}>{flash}</Text>
          </Pressable>
        ) : null}
        {showTip ? (
          <Suggestion label="Extra protection" title="Turn on two-step sign-in" body="A 6-digit code from your phone keeps your health information safe if someone learns your password. It is optional."
            action="Turn it on" onAction={() => router.push('/feature/two-step')} onDismiss={() => { setTipGone(true); if (uid) void dismiss('two-step', uid); }} />
        ) : null}
        <H2>Your health</H2>
        <View style={{ gap: 16 }}>
          <Card title="Emergency" icon="🚨" tone="danger" onPress={() => router.push('/feature/emergency')}>
            <CardNote>See the number to call and where it comes from.</CardNote>
          </Card>
          <Card title="Blood pressure" icon="❤️" accent="red" onPress={() => router.push('/feature/blood-pressure')}>
            {bp && bp !== 'error' ? (
              <>
                <CardValue accent="red" unit="mmHg">{bp.systolic}/{bp.diastolic}</CardValue>
                <CardNote>Last reading, {new Date(bp.taken_at).toLocaleDateString()}</CardNote>
              </>
            ) : (
              <CardNote>{!loaded ? 'Loading.' : bp === 'error' ? 'Could not load your readings. Tap to try again.' : 'No readings yet. Tap to add one.'}</CardNote>
            )}
          </Card>
          <Card title="My conditions" icon="🩺" accent="blue" onPress={() => router.push('/feature/conditions')}>
            <CardNote>Information from official health sources.</CardNote>
          </Card>
        </View>
        <TrackingSuggestions />
        <DisclaimerFooter />
        <View style={{ height: 110 }} />
      </Screen>
    </ScrollView>
  );
}
