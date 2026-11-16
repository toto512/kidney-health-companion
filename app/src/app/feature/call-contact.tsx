import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Platform, ScrollView, Text } from 'react-native';
import { BigButton, Body, H1, Panel, Screen } from '@/components/ui';
import { displayPhone, relationshipLabel, telHref } from '@/lib/contactLogic';
import { Contact, loadContactsOrCopy } from '@/lib/emergencyContacts';
import { useAuth } from '@/lib/auth';
import { font, useColors } from '@/theme/tokens';

// Confirm step before dialing. The id comes in the address, never the phone number.
export default function CallContact() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { session } = useAuth();
  const color = useColors();
  const [c, setC] = useState<Contact | null | undefined>(undefined);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const uid = session?.user.id;
    if (!uid) return;
    void loadContactsOrCopy(uid).then((r) => setC(r?.list.find((x) => x.id === id) ?? null));
  }, [id, session?.user.id]);
  const href = c ? telHref(c.phone) : null;
  const isWeb = Platform.OS === 'web';
  async function dial() {
    if (!href) return;
    try { await Linking.openURL(href); } catch { setFailed(true); }
  }
  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));
  return (
    <ScrollView>
      <Screen>
        {c === undefined ? <H1>One moment</H1> : null}
        {c === null ? (<><H1>Contact not found</H1><Body>This person is no longer on your list.</Body></>) : null}
        {c ? (
          <>
            <H1>{`Call ${c.name}?`}</H1>
            <Panel>
              <Body>{relationshipLabel(c.relationship)}</Body>
              <Text selectable accessibilityLabel={`Number ${c.phone.split('').join(' ')}`} style={{ fontSize: 34, lineHeight: 42, fontWeight: '800', color: color.text }}>{displayPhone(c.phone)}</Text>
            </Panel>
            <BigButton label={`Call ${c.name} now`} onPress={dial} />
            {isWeb ? <Body>On a computer, Call works only if it has a calling app, such as Phone Link, Teams or FaceTime. If nothing happens, dial the number above on your phone.</Body> : null}
            {failed ? <Body tone="danger">This device could not start the call. Dial the number above.</Body> : null}
            <Body>This calls from your own phone. The app does not contact emergency services. If it is an emergency, call your local emergency number.</Body>
            <BigButton variant="secondary" label="Cancel" onPress={back} />
          </>
        ) : <BigButton variant="secondary" label="Back" onPress={back} />}
      </Screen>
    </ScrollView>
  );
}
