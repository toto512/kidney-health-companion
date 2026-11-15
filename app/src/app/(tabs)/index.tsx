import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Card, CardNote, CardValue, DisclaimerFooter, H1, Screen } from '@/components/ui';
import { takeFlash } from '@/lib/flash';
import { supabase } from '@/lib/supabase';
import { font, space, useColors } from '@/theme/tokens';

type Latest = { systolic: number; diastolic: number; taken_at: string } | null | 'error';

export default function Today() {
  const [bp, setBp] = useState<Latest>(null);
  const [loaded, setLoaded] = useState(false);
  const color = useColors();
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
        <View style={{ gap: 16 }}>
          <Card title="Emergency" icon="🚨" tone="danger" onPress={() => router.push('/feature/emergency')}>
            <CardNote>See the number to call and where it comes from.</CardNote>
          </Card>
          <Card title="Blood pressure" icon="❤️" onPress={() => router.push('/feature/blood-pressure')}>
            {bp && bp !== 'error' ? (
              <>
                <CardValue>{bp.systolic}/{bp.diastolic}</CardValue>
                <CardNote>Last reading, {new Date(bp.taken_at).toLocaleDateString()}</CardNote>
              </>
            ) : (
              <CardNote>{!loaded ? 'Loading.' : bp === 'error' ? 'Could not load your readings. Tap to try again.' : 'No readings yet. Tap to add one.'}</CardNote>
            )}
          </Card>
          <Card title="My conditions" icon="🩺" onPress={() => router.push('/feature/conditions')}>
            <CardNote>Information from official health sources.</CardNote>
          </Card>
        </View>
        <DisclaimerFooter />
      </Screen>
    </ScrollView>
  );
}
