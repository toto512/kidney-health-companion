import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { BigButton, Body, DisclaimerFooter, H1, Screen } from '@/components/ui';
import { EMERGENCY, emergencyView } from '@/content/emergency';
import { COUNTRIES, Country, countryName } from '@/lib/profile';
import { supabase } from '@/lib/supabase';
import { font, useColors } from '@/theme/tokens';

// Sources for the emergency number: verbatim official quote, link, review date and our check date.
export default function Emergency() {
  const color = useColors();
  const [country, setCountry] = useState<string | null | undefined>(undefined);
  // Reads the saved country every time the screen comes into view, so a country changed in the profile shows at once.
  useFocusEffect(useCallback(() => {
    let alive = true;
    supabase.from('profiles').select('country_code').maybeSingle().then(({ data }) => { if (alive) setCountry(data?.country_code ?? null); });
    return () => { alive = false; };
  }, []));
  const view = emergencyView(country);
  const shown: Country[] = country === undefined ? [] : view.kind === 'supported' ? [view.country] : view.kind === 'all' ? COUNTRIES.map((c) => c.code) : [];
  return (
    <ScrollView>
      <Screen>
        <H1>Emergency numbers</H1>
        {country === undefined ? <Body>Loading.</Body> : null}
        {view.kind === 'none' ? (
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
