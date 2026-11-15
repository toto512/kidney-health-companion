import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, Text } from 'react-native';
import { BigButton, Body, DisclaimerFooter, H1, Panel, Screen, SectionHeader } from '@/components/ui';
import { CONDITIONS, EXTRAS, sourceReviewOverdue } from '@/content/conditions';
import { countryName, isSupported } from '@/lib/profile';
import { supabase } from '@/lib/supabase';
import { AccentName, font, useColors } from '@/theme/tokens';

const ICON: Record<string, string> = { ckd: '🫘', gout: '🦶', hbp: '❤️', diabetes: '🩸', heart: '🫀' };
const ACCENT: Record<string, AccentName> = { ckd: 'teal', gout: 'orange', hbp: 'red', diabetes: 'purple', heart: 'red' };

// Shows only verbatim official quotes with link and check date. No advice, no numbers of ours.
export default function Conditions() {
  const color = useColors();
  const [country, setCountry] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    supabase.from('profiles').select('country_code').maybeSingle().then(({ data }) => setCountry(data?.country_code ?? null));
  }, []);
  const today = new Date();

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
        {country && !isSupported(country) ? <Body>Health information for {countryName(country)} is not available in this app yet. We only show text that is copied from official sources, and we have not checked any for your country.</Body> : null}
        {isSupported(country) ? (
          <>
            <Body>Official sources for {countryName(country)}. The text below is copied word for word from each page.</Body>
            {CONDITIONS.map((c) => {
              const f = c.facts[country];
              return (
                <Panel key={c.id}>
                  <SectionHeader icon={ICON[c.id] ?? '🩺'} accent={ACCENT[c.id] ?? 'blue'}>{c.label}</SectionHeader>
                  <Body>{'“'}{f.quote}{'”'}</Body>
                  {EXTRAS[`${c.id}.${country}`]?.symptoms ? <Body>Symptoms, from the same page: {'\u201C'}{EXTRAS[`${c.id}.${country}`].symptoms}{'\u201D'}</Body> : null}
                  {EXTRAS[`${c.id}.${country}`]?.getHelp ? <Body>Getting help, from the same page: {'\u201C'}{EXTRAS[`${c.id}.${country}`].getHelp}{'\u201D'}</Body> : null}
                  <Body>Source: {f.source}{f.sourceType === 'charity' ? ' (charity, not government)' : ''}</Body>
                  <Body>Page says last reviewed: {f.pageReviewed ?? 'no date shown'}. We checked it on {f.checkedOn}.</Body>
                  {sourceReviewOverdue(f, today) ? <Body tone="danger">The source{"'"}s own review date has passed. Check the page for newer information.</Body> : null}
                  <Pressable accessibilityRole="link" onPress={() => Linking.openURL(f.url)} style={{ minHeight: 56, justifyContent: 'center' }}>
                    <Text style={{ fontSize: font.label, fontWeight: '700', color: color.primary, textDecorationLine: 'underline' }}>Open the official page</Text>
                  </Pressable>
                </Panel>
              );
            })}
          </>
        ) : null}
        <BigButton variant="secondary" label="Back to my health" onPress={() => router.replace('/')} />
        <DisclaimerFooter />
      </Screen>
    </ScrollView>
  );
}
