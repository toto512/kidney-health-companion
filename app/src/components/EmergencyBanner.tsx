import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { EMERGENCY } from '@/content/emergency';
import { isSupported } from '@/lib/profile';
import { supabase } from '@/lib/supabase';
import { color, font } from '@/theme/tokens';

// Always one compact strip. Quotes and source links live on their own screen, so this never pushes a form down.
export function EmergencyBanner() {
  const [country, setCountry] = useState<string | null>(null);
  useEffect(() => {
    supabase.from('profiles').select('country_code').maybeSingle().then(({ data }) => setCountry(data?.country_code ?? null));
  }, []);
  const known = isSupported(country) ? country : null;
  const other = !!country && !known;
  const headline = other
    ? 'Emergency: call your local emergency number'
    : known
    ? `Emergency: call ${EMERGENCY[known].number}`
    : `Emergency: call ${EMERGENCY.GB.number} (UK) or ${EMERGENCY.US.number} (US, Canada)`;
  return (
    <View accessibilityRole="alert" style={{ borderLeftWidth: 6, borderColor: color.danger, backgroundColor: '#FEF3F2', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 14, gap: 4 }}>
      <Text style={{ fontSize: font.label, fontWeight: '700', color: color.danger }}>{headline}</Text>
      <Pressable accessibilityRole="link" onPress={() => router.push('/feature/emergency')} style={{ minHeight: 44, justifyContent: 'center' }}>
        <Text style={{ fontSize: font.body, color: color.text, textDecorationLine: 'underline' }}>{other ? 'More' : 'Sources'}</Text>
      </Pressable>
    </View>
  );
}
