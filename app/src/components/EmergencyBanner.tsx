import { useEffect, useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { EMERGENCY } from '@/content/emergency';
import { COUNTRIES, Country } from '@/lib/profile';
import { supabase } from '@/lib/supabase';
import { color, font } from '@/theme/tokens';

// Always visible. With a saved country it shows that country's number; otherwise all three, so nothing is hidden in an emergency.
export function EmergencyBanner() {
  const [country, setCountry] = useState<Country | null>(null);
  useEffect(() => {
    supabase.from('profiles').select('country_code').maybeSingle().then(({ data }) => setCountry((data?.country_code as Country) ?? null));
  }, []);
  const shown = country ? [country] : (COUNTRIES.map((c) => c.code) as Country[]);
  return (
    <View accessibilityRole="alert" style={{ borderWidth: 3, borderColor: color.danger, borderRadius: 12, padding: 16, gap: 8 }}>
      <Text style={{ fontSize: font.label, fontWeight: '700', color: color.danger }}>Emergency? Call now.</Text>
      {shown.map((c) => {
        const e = EMERGENCY[c];
        return (
          <View key={c} style={{ gap: 4 }}>
            <Text style={{ fontSize: font.body, fontWeight: '700', color: color.text }}>{COUNTRIES.find((x) => x.code === c)?.label}: {e.number}</Text>
            <Text style={{ fontSize: font.body, color: color.text }}>{'“'}{e.quote}{'”'}</Text>
            <Pressable accessibilityRole="link" onPress={() => Linking.openURL(e.url)}>
              <Text style={{ fontSize: font.body, color: color.text, textDecorationLine: 'underline' }}>
                Source: {e.source}, page reviewed {e.pageReviewed ?? 'date not shown'}, checked {e.checkedOn}
              </Text>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}
