import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { BigButton, Body, DisclaimerFooter, H1, Screen } from '@/components/ui';
import { EMERGENCY } from '@/content/emergency';
import { COUNTRIES, Country, countryName, isSupported } from '@/lib/profile';
import { supabase } from '@/lib/supabase';
import { color, font } from '@/theme/tokens';

// Sources for the emergency number: verbatim official quote, link, review date and our check date.
export default function Emergency() {
  const [country, setCountry] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    supabase.from('profiles').select('country_code').maybeSingle().then(({ data }) => setCountry(data?.country_code ?? null));
  }, []);
  const shown: Country[] = isSupported(country) ? [country] : country ? [] : COUNTRIES.map((c) => c.code);
  return (
    <ScrollView>
      <Screen>
        <H1>Emergency numbers</H1>
        {country && !isSupported(country) ? (
          <Body>We have no checked emergency number for {countryName(country)} in this app yet. Find your local emergency number now and keep it where you can see it.</Body>
        ) : null}
        {shown.map((c) => {
          const e = EMERGENCY[c];
          return (
            <View key={c} style={{ gap: 6, paddingVertical: 12, borderTopWidth: 1, borderColor: color.text }}>
              <Text style={{ fontSize: font.h2, fontWeight: '700', color: color.danger }}>{COUNTRIES.find((x) => x.code === c)?.label}: call {e.number}</Text>
              <Body>{'“'}{e.quote}{'”'}</Body>
              <Pressable accessibilityRole="link" onPress={() => Linking.openURL(e.url)}>
                <Text style={{ fontSize: font.body, color: color.text, textDecorationLine: 'underline' }}>
                  {e.source}, page reviewed {e.pageReviewed ?? 'date not shown'}, checked {e.checkedOn}
                </Text>
              </Pressable>
            </View>
          );
        })}
        <BigButton label="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
        <DisclaimerFooter />
      </Screen>
    </ScrollView>
  );
}
