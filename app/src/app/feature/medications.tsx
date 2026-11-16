import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { BigButton, Body, DisclaimerFooter, H1, Panel, Screen, SectionHeader } from '@/components/ui';
import { linkFor, medById, medLabel } from '@/content/medList';
import { customKey, listKey } from '@/lib/medSelection';
import { loadMyMeds, MyMeds } from '@/lib/userMedications';
import { supabase } from '@/lib/supabase';
import { font, useColors } from '@/theme/tokens';

// A list of names the person chose. No doses, schedules or advice. "Official page" shows only once a verified link exists.
export default function Medications() {
  const color = useColors();
  const [m, setM] = useState<MyMeds | null | undefined>(undefined);
  useFocusEffect(useCallback(() => { let alive = true; void loadMyMeds().then((v) => { if (alive) setM(v); }); return () => { alive = false; }; }, []));
  const [country, setCountry] = useState<string | null>(null);
  useEffect(() => { void supabase.from('profiles').select('country_code').maybeSingle().then(({ data }) => setCountry(data?.country_code ?? null)); }, []);
  const items = (m?.ids ?? []).map(medById).filter((x) => !!x);

  return (
    <ScrollView>
      <Screen>
        <H1>My medications</H1>
        {m === undefined ? <Body>Loading...</Body> : null}
        {m === null ? <Body tone="danger">Could not load your medicines. Try again.</Body> : null}
        {m && items.length === 0 && m.custom.length === 0 ? (
          <Panel>
            <Body>You have not chosen any medicines yet. It is optional, and only you can see it.</Body>
            <BigButton label="Choose my medicines" onPress={() => router.push('/feature/choose-medicines')} />
          </Panel>
        ) : null}
        {m && (items.length > 0 || m.custom.length > 0) ? (
          <Panel>
            <SectionHeader icon="💊" accent="teal">Medicines I take</SectionHeader>
            {items.map((x) => x && (
              <View key={x.med_id} style={{ gap: 4, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: color.border }}>
                <Text style={{ fontSize: font.label, fontWeight: '700', color: color.text }}>{medLabel(x)}</Text>
                {m.strengths[listKey(x.med_id)] ? <Text style={{ fontSize: font.body, color: color.text }}>Strength: {m.strengths[listKey(x.med_id)]}</Text> : null}
                {(() => { const l = linkFor(x, country); return l ? (
                  <View>
                    <Pressable accessibilityRole="link" onPress={() => Linking.openURL(l.url)} style={{ minHeight: 48, justifyContent: 'center' }}>
                      <Text style={{ fontSize: font.body, fontWeight: '700', color: color.primary, textDecorationLine: 'underline' }}>Official page: {l.publisher}</Text>
                    </Pressable>
                    {l.page_title ? <Text style={{ fontSize: font.body, color: color.muted }}>Page: {l.page_title}</Text> : null}
                    <Text style={{ fontSize: font.body, color: color.muted }}>{l.page_reviewed ? `Page last reviewed ${l.page_reviewed}. ` : ''}Link checked {l.checked_on}.{l.country === 'CA' ? ' This database lists brands ever authorised in Canada, not only those on sale.' : ''}</Text>
                  </View>
                ) : null; })()}
              </View>
            ))}
            {m.custom.map((c) => (
              <View key={c} style={{ paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: color.border }}>
                <Text style={{ fontSize: font.label, fontWeight: '700', color: color.text }}>{c}</Text>
                {m.strengths[customKey(c)] ? <Text style={{ fontSize: font.body, color: color.text }}>Strength: {m.strengths[customKey(c)]}</Text> : null}
                <Text style={{ fontSize: font.body, color: color.muted }}>Added by you</Text>
              </View>
            ))}
          </Panel>
        ) : null}
        {m ? <BigButton variant="secondary" label={items.length || m.custom.length ? 'Change my medicines' : 'Pick from the list'} onPress={() => router.push('/feature/choose-medicines')} /> : null}
        <Body>This is a list you made. Any strength is what you typed. As on your label, ask your pharmacist. It does not tell you how to take anything.</Body>
        <BigButton variant="secondary" label="Back to my health" onPress={() => router.replace('/')} />
        <DisclaimerFooter />
      </Screen>
    </ScrollView>
  );
}
