import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Platform, ScrollView, Text } from 'react-native';
import { BigButton, Body, Panel, Screen } from '@/components/ui';
import { EMERGENCY, emergencyView, LISTED_EMERGENCY } from '@/content/emergency';
import { displayPhone, relationshipLabel, telHref } from '@/lib/contactLogic';
import { Contact, loadContactsOrCopy } from '@/lib/emergencyContacts';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/i18n/I18nProvider';
import { relLabel } from '@/i18n/labels';
import { supabase } from '@/lib/supabase';
import { font, useColors } from '@/theme/tokens';

// "Not for emergencies" line: names the official number only when it is a single short number.
function emergencyLine(t: (k: 'call.notEmergency' | 'call.notEmergencyLocal', v?: Record<string, string>) => string, country: string | null | undefined): string {
  const v = emergencyView(country);
  const n = v.kind === 'supported' ? EMERGENCY[v.country].number : v.kind === 'listed' ? LISTED_EMERGENCY[v.code].number : '';
  return /^[0-9-]{2,5}$/.test(n) ? t('call.notEmergency', { number: n }) : t('call.notEmergencyLocal');
}

// Confirm step before dialing. The id comes in the address, never the phone number.
export default function CallContact() {
  const { t } = useI18n();
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
        {c === undefined ? <Body>{t('call.oneMoment')}</Body> : null}
        {c === null ? (<><Body>{t('call.gone')}</Body><BigButton variant="secondary" label={t('people.back')} onPress={back} /></>) : null}
        {c ? (
          <>
            <Panel>
              <Text accessibilityRole="header" style={{ fontSize: font.h1, lineHeight: font.h1 * 1.2, fontWeight: '800', color: color.text }}>{c.name}</Text>
              <Body>{relLabel(t, c.relationship, relationshipLabel(c.relationship))}</Body>
              <Text selectable accessibilityLabel={t('call.number', { digits: c.phone.split('').join(' ') })} style={{ fontSize: Math.round(font.h1 * 1.1), lineHeight: Math.round(font.h1 * 1.4), fontWeight: '800', color: color.text }}>{displayPhone(c.phone)}</Text>
            </Panel>
            <BigButton label={t('call.now')} onPress={dial} />
            <BigButton variant="secondary" label={t('people.cancel')} onPress={back} />
            <Body>{emergencyLine(t, country)}</Body>
            {Platform.OS === 'web' ? <Body>{t('contact.webNote')}</Body> : null}
            {failed ? <Body tone="danger">{t('call.failed')}</Body> : null}
          </>
        ) : null}
      </Screen>
    </ScrollView>
  );
}
