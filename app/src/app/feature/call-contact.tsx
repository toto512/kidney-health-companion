import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Platform, ScrollView, Text } from 'react-native';
import { BigButton, Body, Panel, Screen } from '@/components/ui';
import { EMERGENCY, emergencyView, LISTED_EMERGENCY } from '@/content/emergency';
import { displayPhone, relationshipLabel, telHref } from '@/lib/contactLogic';
import { Contact, loadContactsOrCopy } from '@/lib/emergencyContacts';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { font, useColors } from '@/theme/tokens';

// "Not for emergencies" line: names the official number only when it is a single short number.
function emergencyLine(country: string | null | undefined): string {
  const v = emergencyView(country);
  const n = v.kind === 'supported' ? EMERGENCY[v.country].number : v.kind === 'listed' ? LISTED_EMERGENCY[v.code].number : '';
  return /^[0-9-]{2,5}$/.test(n) ? `Not for emergencies. Call ${n} for those.` : 'Not for emergencies. Call your local emergency number for those.';
}

// Confirm step before dialing. The id comes in the address, never the phone number.
export default function CallContact() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { session } = useAuth();
  const color = useColors();
  const [c, setC] = useState<Contact | null | undefined>(undefined);
  const [country, setCountry] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const uid = session?.user.id;
    if (!uid) return;
    void loadContactsOrCopy(uid).then((r) => setC(r?.list.find((x) => x.id === id) ?? null));
    supabase.from('profiles').select('country_code').maybeSingle().then(({ data }) => setCountry(data?.country_code ?? null));
  }, [id, session?.user.id]);
  const href = c ? telHref(c.phone) : null;
  async function dial() {
    if (!href) return;
    try { await Linking.openURL(href); } catch { setFailed(true); }
  }
  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));
  return (
    <ScrollView>
      <Screen>
        {c === undefined ? <Body>One moment.</Body> : null}
        {c === null ? (<><Body>This person is no longer on your list.</Body><BigButton variant="secondary" label="Back" onPress={back} /></>) : null}
        {c ? (
          <>
            <Panel>
              <Text accessibilityRole="header" style={{ fontSize: font.h1, lineHeight: font.h1 * 1.2, fontWeight: '800', color: color.text }}>{c.name}</Text>
              <Body>{relationshipLabel(c.relationship)}</Body>
              <Text selectable accessibilityLabel={`Number ${c.phone.split('').join(' ')}`} style={{ fontSize: Math.round(font.h1 * 1.1), lineHeight: Math.round(font.h1 * 1.4), fontWeight: '800', color: color.text }}>{displayPhone(c.phone)}</Text>
            </Panel>
            <BigButton label="Call now" onPress={dial} />
            <BigButton variant="secondary" label="Cancel" onPress={back} />
            <Body>{emergencyLine(country)}</Body>
            {Platform.OS === 'web' ? <Body>On a computer, this needs a calling app.</Body> : null}
            {failed ? <Body tone="danger">The call did not start. Dial the number above.</Body> : null}
          </>
        ) : null}
      </Screen>
    </ScrollView>
  );
}
