import * as DocumentPicker from 'expo-document-picker';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { UploadButtons } from '@/components/UploadButtons';
import { BigButton, Body, DisclaimerFooter, H1, Panel, Screen, SectionHeader } from '@/components/ui';
import { linkFor, medById, medLabel } from '@/content/medList';
import { useI18n } from '@/i18n/I18nProvider';
import { customKey, listKey } from '@/lib/medSelection';
import { loadMyMeds, MyMeds } from '@/lib/userMedications';
import { supabase } from '@/lib/supabase';
import { font, useColors } from '@/theme/tokens';

// A list of names the person chose. No doses, schedules or advice. "Official page" shows only once a verified link exists.
export default function Medications() {
  const color = useColors();
  const { t, lang } = useI18n();
  const [m, setM] = useState<MyMeds | null | undefined>(undefined);
  useFocusEffect(useCallback(() => { let alive = true; void loadMyMeds().then((v) => { if (alive) setM(v); }); return () => { alive = false; }; }, []));
  const [country, setCountry] = useState<string | null>(null);
  useEffect(() => { void supabase.from('profiles').select('country_code').maybeSingle().then(({ data }) => setCountry(data?.country_code ?? null)); }, []);
  const items = (m?.ids ?? []).map(medById).filter((x) => !!x);

  // File or picture: the next screen reads it on this device and asks you to confirm before anything is added.
  function scan(a: { uri: string; mimeType?: string | null; fileSize?: number | null } | undefined) {
    if (a) router.push({ pathname: '/feature/choose-medicines', params: { uri: a.uri, mime: a.mimeType ?? '', size: String(a.fileSize ?? '') } });
  }
  async function pickFile() {
    const res = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'], copyToCacheDirectory: true, multiple: false });
    if (!res.canceled) scan(res.assets[0]);
  }

  return (
    <ScrollView>
      <Screen>
        <H1>{t('medlist.title')}</H1>
        {m === undefined ? <Body>{t('common.loading')}</Body> : null}
        {m === null ? <Body tone="danger">{t('medlist.errLoad')}</Body> : null}
        {m && items.length === 0 && m.custom.length === 0 ? (
          <Panel>
            <Body>{t('medlist.none')}</Body>
            <BigButton label={t('medlist.choose')} onPress={() => router.push('/feature/choose-medicines')} />
          </Panel>
        ) : null}
        {m && (items.length > 0 || m.custom.length > 0) ? (
          <Panel>
            <SectionHeader icon="💊" accent="teal">{t('meds.pickTitle')}</SectionHeader>
            {items.map((x) => x && (
              <View key={x.med_id} style={{ gap: 4, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: color.border }}>
                <Text style={{ fontSize: font.label, fontWeight: '700', color: color.text }}>{medLabel(x)}</Text>
                {m.strengths[listKey(x.med_id)] ? <Text style={{ fontSize: font.body, color: color.text }}>{t('medlist.strength', { s: m.strengths[listKey(x.med_id)] })}</Text> : null}
                {(() => { const l = linkFor(x, country); return l ? (
                  <View>
                    <Pressable accessibilityRole="link" onPress={() => Linking.openURL(l.url)} style={{ minHeight: 48, justifyContent: 'center' }}>
                      <Text style={{ fontSize: font.body, fontWeight: '700', color: color.primary, textDecorationLine: 'underline' }}>{t('medlist.official', { publisher: l.publisher })}</Text>
                    </Pressable>
                    {l.page_title ? <Text style={{ fontSize: font.body, color: color.muted }}>{t('medlist.page', { title: l.page_title })}</Text> : null}
                    <Text style={{ fontSize: font.body, color: color.muted }}>{l.page_reviewed ? t('medlist.pageReviewed', { date: l.page_reviewed }) : ''}{t('medlist.linkChecked', { date: l.checked_on })}{l.country === 'CA' ? t('medlist.caNote') : ''}</Text>
                  </View>
                ) : null; })()}
              </View>
            ))}
            {m.custom.map((c) => (
              <View key={c} style={{ paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: color.border }}>
                <Text style={{ fontSize: font.label, fontWeight: '700', color: color.text }}>{c}</Text>
                {m.strengths[customKey(c)] ? <Text style={{ fontSize: font.body, color: color.text }}>{t('medlist.strength', { s: m.strengths[customKey(c)] })}</Text> : null}
                <Text style={{ fontSize: font.body, color: color.muted }}>{t('medlist.addedByYou')}</Text>
              </View>
            ))}
          </Panel>
        ) : null}
        {m ? <UploadButtons onFile={() => void pickFile()} onAsset={scan} /> : null}
        {m ? <BigButton variant="secondary" label={items.length || m.custom.length ? t('medlist.change') : t('medlist.pick')} onPress={() => router.push('/feature/choose-medicines')} /> : null}
        <Body>{t('medlist.note')}</Body>
        <BigButton variant="secondary" label={t('profile.backHealth')} onPress={() => router.replace('/')} />
        <DisclaimerFooter />
      </Screen>
    </ScrollView>
  );
}
