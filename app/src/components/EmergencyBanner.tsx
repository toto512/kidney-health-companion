import { useEffect, useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { EMERGENCY } from '@/content/emergency';
import { COUNTRIES, Country } from '@/lib/profile';
import { supabase } from '@/lib/supabase';
import { color, font } from '@/theme/tokens';

// One large line that is always visible. Quotes and source links sit behind "Sources" so the page stays calm.
export function EmergencyBanner() {
  const [country, setCountry] = useState<Country | null>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    supabase.from('profiles').select('country_code').maybeSingle().then(({ data }) => setCountry((data?.country_code as Country) ?? null));
  }, []);
  const shown = country ? [country] : (COUNTRIES.map((c) => c.code) as Country[]);
  const headline = country
    ? `Emergency: call ${EMERGENCY[country].number}`
    : `Emergency: call ${EMERGENCY.GB.number} (UK) or ${EMERGENCY.US.number} (US, Canada)`;
  return (
    <View accessibilityRole="alert" style={{ borderLeftWidth: 6, borderColor: color.danger, backgroundColor: '#FEF3F2', borderRadius: 8, padding: 14, gap: 8 }}>
      <Text style={{ fontSize: font.label, fontWeight: '700', color: color.danger }}>{headline}</Text>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen(!open)} style={{ minHeight: 44, justifyContent: 'center' }}>
        <Text style={{ fontSize: font.body, color: color.text, textDecorationLine: 'underline' }}>{open ? 'Hide sources' : 'Sources'}</Text>
      </Pressable>
      {open ? shown.map((c) => {
        const e = EMERGENCY[c];
        return (
          <View key={c} style={{ gap: 4 }}>
            <Text style={{ fontSize: font.body, fontWeight: '700', color: color.text }}>{COUNTRIES.find((x) => x.code === c)?.label}: {e.number}</Text>
            <Text style={{ fontSize: font.body, color: color.text }}>{'“'}{e.quote}{'”'}</Text>
            <Pressable accessibilityRole="link" onPress={() => Linking.openURL(e.url)}>
              <Text style={{ fontSize: font.body, color: color.text, textDecorationLine: 'underline' }}>
                {e.source}, page reviewed {e.pageReviewed ?? 'date not shown'}, checked {e.checkedOn}
              </Text>
            </Pressable>
          </View>
        );
      }) : null}
    </View>
  );
}
