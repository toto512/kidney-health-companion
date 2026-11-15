import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Card, CardNote, CardValue, DisclaimerFooter, H1, Screen } from '@/components/ui';
import { supabase } from '@/lib/supabase';

type Latest = { systolic: number; diastolic: number; taken_at: string } | null | 'error';

export default function Today() {
  const [bp, setBp] = useState<Latest>(null);
  const [loaded, setLoaded] = useState(false);

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
