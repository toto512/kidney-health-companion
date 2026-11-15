import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { BigButton, Body, DisclaimerFooter, H1, Screen } from '@/components/ui';
import { CONDITIONS, EXTRAS, sourceReviewOverdue } from '@/content/conditions';
import { COUNTRIES, Country } from '@/lib/profile';
import { supabase } from '@/lib/supabase';
import { color, font } from '@/theme/tokens';

// Shows only verbatim official quotes with link and check date. No advice, no numbers of ours.
export default function Conditions() {
  const [country, setCountry] = useState<Country | null | undefined>(undefined);
  useEffect(() => {
    supabase.from('profiles').select('country_code').maybeSingle().then(({ data }) => setCountry((data?.country_code as Country) ?? null));
  }, []);
  const today = new Date();
  const label = COUNTRIES.find((c) => c.code === country)?.label;

  return (
    <ScrollView>
      <Screen>
        <H1>My conditions</H1>
        {country === undefined ? <Body>Loading...</Body> : null}
        {country === null ? (
          <>
            <Body>Choose your country in your profile first. The sources depend on it.</Body>
            <BigButton label="Open my profile" onPress={() => router.push('/feature/profile')} />
          </>
        ) : null}
        {country ? (
          <>
            <Body>Official sources for {label}. The text below is copied word for word from each page.</Body>
            {CONDITIONS.map((c) => {
              const f = c.facts[country];
              return (
                <View key={c.id} style={{ gap: 8, paddingVertical: 14, borderTopWidth: 1, borderColor: color.text }}>
                  <Text accessibilityRole="header" style={{ fontSize: font.label, fontWeight: '700', color: color.text }}>{c.label}</Text>
                  <Body>{'“'}{f.quote}{'”'}</Body>
                  {EXTRAS[`${c.id}.${country}`]?.symptoms ? <Body>Symptoms, from the same page: {'\u201C'}{EXTRAS[`${c.id}.${country}`].symptoms}{'\u201D'}</Body> : null}
                  {EXTRAS[`${c.id}.${country}`]?.getHelp ? <Body>Getting help, from the same page: {'\u201C'}{EXTRAS[`${c.id}.${country}`].getHelp}{'\u201D'}</Body> : null}
                  <Body>Source: {f.source}{f.sourceType === 'charity' ? ' (charity, not government)' : ''}</Body>
                  <Body>Page says last reviewed: {f.pageReviewed ?? 'no date shown'}. We checked it on {f.checkedOn}.</Body>
                  {sourceReviewOverdue(f, today) ? <Body tone="danger">The source{"'"}s own review date has passed. Check the page for newer information.</Body> : null}
                  <Pressable accessibilityRole="link" onPress={() => Linking.openURL(f.url)}>
                    <Text style={{ fontSize: font.body, color: color.text, textDecorationLine: 'underline' }}>Open the official page</Text>
                  </Pressable>
                </View>
              );
            })}
          </>
        ) : null}
        <BigButton label="Back to my health" onPress={() => router.replace('/')} />
        <DisclaimerFooter />
      </Screen>
    </ScrollView>
  );
}
