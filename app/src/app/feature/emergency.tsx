import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Linking, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { BigButton, Body, CategoryBadge, DisclaimerFooter, H1, Panel, Screen } from '@/components/ui';
import { EMERGENCY, emergencyView, LISTED_EMERGENCY } from '@/content/emergency';
import { emergencyDialFor } from '@/content/emergencyDial';
import { COUNTRIES, Country, countryName } from '@/lib/profile';
import { supabase } from '@/lib/supabase';
import { font, useColors } from '@/theme/tokens';

type EntryProps = { calls?: string; place: string; number: string; quote: string; lang?: string; source: string; url: string; reviewed: string; checked: string };

// One tap, no confirm step: for an emergency every second counts. The confirm screen is only for personal contacts.
function CallButtons({ country }: { country: string }) {
  const targets = emergencyDialFor(country);
  const [failed, setFailed] = useState(false);
  if (!targets.length) return null;
  return (
    <>
      {targets.map((t) => (
        <BigButton key={t.tel} label={t.text} onPress={() => { Linking.openURL(t.tel).catch(() => setFailed(true)); }} />
      ))}
      {Platform.OS === 'web' ? <Body>On a computer, this needs a calling app.</Body> : null}
      {failed ? <Body tone="danger">The call did not start. Dial the number yourself.</Body> : null}
      <Body>This calls from your own phone. The app does not contact emergency services.</Body>
    </>
  );
}

// One country's number as a large line, then the exact official quote and where it came from.
function Entry({ calls, place, number, quote, lang, source, url, reviewed, checked }: EntryProps) {
  const color = useColors();
  return (
    <Panel tone="danger">
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <CategoryBadge icon="🚨" accent="red" size={44} />
        <Text style={{ flex: 1, fontSize: font.label, fontWeight: '700', color: color.text }}>{place}</Text>
      </View>
      <Text accessibilityRole="header" style={{ fontSize: 34, lineHeight: 42, fontWeight: '800', color: color.danger }}>Call {number}</Text>
      {calls ? <CallButtons country={calls} /> : null}
      <Body>{'\u201C'}{quote}{'\u201D'}{lang ? ` (quoted in ${lang})` : ''}</Body>
      <Pressable accessibilityRole="link" onPress={() => Linking.openURL(url)} style={{ minHeight: 56, justifyContent: 'center' }}>
        <Text style={{ fontSize: font.body, color: color.primary, textDecorationLine: 'underline', lineHeight: font.body * 1.4 }}>
          {source}. Page {reviewed}. Checked {checked}.
        </Text>
      </Pressable>
    </Panel>
  );
}

// Sources for the emergency number: verbatim official quote, link, review date and our check date.
export default function Emergency() {
  const [country, setCountry] = useState<string | null | undefined>(undefined);
  // Reads the saved country every time the screen comes into view, so a country changed in the profile shows at once.
  useFocusEffect(useCallback(() => {
    let alive = true;
    supabase.from('profiles').select('country_code').maybeSingle().then(({ data }) => { if (alive) setCountry(data?.country_code ?? null); });
    return () => { alive = false; };
  }, []));
  const view = emergencyView(country);
  const shown: Country[] = country === undefined ? [] : view.kind === 'supported' ? [view.country] : view.kind === 'all' ? [...COUNTRIES].sort((a, b) => a.label.localeCompare(b.label)).map((c) => c.code) : [];
  return (
    <ScrollView>
      <Screen>
        <H1>Emergency numbers</H1>
        {country === undefined ? <Body>Loading.</Body> : null}
        {view.kind === 'none' ? (
          <Panel><Body>We have no checked emergency number for {countryName(country)} in this app yet. Find your local emergency number now and keep it where you can see it.</Body></Panel>
        ) : null}
        {view.kind === 'listed' && country !== undefined ? (() => {
          const e = LISTED_EMERGENCY[view.code];
          return <Entry calls={view.code} place={countryName(view.code)} number={e.number} quote={e.quote} lang={e.lang} source={e.source} url={e.url} reviewed={e.pageReviewed ?? 'review date not shown'} checked={e.checkedOn} />;
        })() : null}
        {shown.map((c) => {
          const e = EMERGENCY[c];
          return <Entry key={c} calls={view.kind === 'supported' ? c : undefined} place={COUNTRIES.find((x) => x.code === c)?.label ?? c} number={e.number} quote={e.quote} source={e.source} url={e.url} reviewed={e.pageReviewed ? `reviewed ${e.pageReviewed}` : 'review date not shown'} checked={e.checkedOn} />;
        })}
        <BigButton variant="secondary" label="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
        <DisclaimerFooter />
      </Screen>
    </ScrollView>
  );
}
