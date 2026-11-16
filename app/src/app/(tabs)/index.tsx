import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { BigButton, Card, CardNote, CardValue, DisclaimerFooter, H1, H2, Screen, Suggestion } from '@/components/ui';
import { TrackingSuggestions } from '@/components/TrackingSuggestions';
import { useAuth } from '@/lib/auth';
import { dismiss, wasDismissed } from '@/lib/suggestions';
import { takeFlash } from '@/lib/flash';
import { useI18n } from '@/i18n/I18nProvider';
import { supabase } from '@/lib/supabase';
import { displayPhone, relationshipLabel } from '@/lib/contactLogic';
import { Contact, loadContactsOrCopy } from '@/lib/emergencyContacts';
import { emergencyView, EMERGENCY, LISTED_EMERGENCY } from '@/content/emergency';
import { emergencyDialFor } from '@/content/emergencyDial';
import { font, space, useColors } from '@/theme/tokens';

type Latest = { systolic: number; diastolic: number; taken_at: string } | null | 'error';

export default function Today() {
  const { t, date } = useI18n();
  const [bp, setBp] = useState<Latest>(null);
  const [loaded, setLoaded] = useState(false);
  const color = useColors();
  const { session, aal, needsMfa } = useAuth();
  const uid = session?.user.id;
  const [tipGone, setTipGone] = useState(true); // hidden until we know it was not dismissed
  useEffect(() => { if (uid) void wasDismissed('two-step', uid).then(setTipGone); }, [uid]);
  const showTip = !tipGone && aal === 'aal1' && !needsMfa;
  const [people, setPeople] = useState<Contact[] | null>(null);
  const [country, setCountry] = useState<string | null | undefined>(undefined);
  const [flash, setFlashMsg] = useState<string | null>(null);

  // A confirmation from the screen the person just came from (for example "Profile saved."), shown for 6 seconds.
  useFocusEffect(useCallback(() => {
    const m = takeFlash();
    if (m) setFlashMsg(m);
  }, []));
  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlashMsg(null), 6000);
    return () => clearTimeout(t);
  }, [flash]);

  useFocusEffect(useCallback(() => {
    let alive = true;
    if (uid) void loadContactsOrCopy(uid).then((r) => { if (alive) setPeople(r?.list ?? null); });
    supabase.from('profiles').select('country_code').maybeSingle().then(({ data }) => { if (alive) setCountry(data?.country_code ?? null); });
    return () => { alive = false; };
  }, [uid]));

  useFocusEffect(useCallback(() => {
    let alive = true;
    supabase.from('bp_readings').select('systolic,diastolic,taken_at').order('taken_at', { ascending: false }).limit(1)
      .then(({ data, error }) => {
        if (!alive) return;
        setBp(error ? 'error' : (data?.[0] ?? null));
        setLoaded(true);
      });
    return () => { alive = false; };
  }, []));

  const ev = emergencyView(country);
  const emergencyNote = ev.kind === 'supported' ? t('today.emergencyNoteNumber', { number: EMERGENCY[ev.country].number }) : ev.kind === 'listed' ? t('today.emergencyNoteNumber', { number: LISTED_EMERGENCY[ev.code].number }) : t('today.emergencyNoteGeneric');
  return (
    <ScrollView>
      <Screen>
        <H1>{t('today.title')}</H1>
        {flash ? (
          <Pressable accessibilityRole="alert" accessibilityLiveRegion="polite" accessibilityLabel={t('today.dismissHint', { message: flash })} onPress={() => setFlashMsg(null)}
            style={{ backgroundColor: color.primaryTint, borderColor: color.primary, borderWidth: 2, borderRadius: 16, padding: space.m, minHeight: 56, justifyContent: 'center' }}>
            <Text style={{ fontSize: font.label, color: color.text, fontWeight: '600' }}>{flash}</Text>
          </Pressable>
        ) : null}
        {showTip ? (
          <Suggestion label={t('today.extraProtection')} title={t('today.twoStepTitle')} body={t('today.twoStepBody')}
            action={t('today.turnOn')} onAction={() => router.push('/feature/two-step')} onDismiss={() => { setTipGone(true); if (uid) void dismiss('two-step', uid); }} />
        ) : null}
        <H2>{t('today.yourHealth')}</H2>
        <View style={{ gap: 16 }}>
          <Card title={t('today.emergencyTitle')} icon="🚨" tone="danger" onPress={() => router.push('/feature/emergency')}>
            <CardNote>{emergencyNote}</CardNote>
          </Card>
          {emergencyDialFor(country).slice(0, 2).map((t) => (
            <BigButton key={t.tel} label={t.text} onPress={() => { Linking.openURL(t.tel).catch(() => {}); }} />
          ))}
          <Card title={t('today.peopleTitle')} icon="👥" accent="teal" onPress={() => router.push('/feature/my-people')}>
            <CardNote>{people && people.length ? t('today.peopleNoteSome') : t('today.peopleNoteNone')}</CardNote>
          </Card>
          {people?.map((c) => (
            <Pressable key={c.id} accessibilityRole="button" accessibilityLabel={t('today.callPerson', { name: c.name, relationship: relationshipLabel(c.relationship), phone: displayPhone(c.phone) })}
              onPress={() => router.push({ pathname: '/feature/call-contact', params: { id: c.id } })}
              style={{ minHeight: 72, borderRadius: 18, borderWidth: 2, borderColor: color.accent.teal, backgroundColor: color.surface, paddingHorizontal: 18, paddingVertical: 12, justifyContent: 'center' }}>
              <Text style={{ fontSize: font.label, fontWeight: '800', color: color.text }}>📞 {c.name}</Text>
              <Text style={{ fontSize: font.body, color: color.muted }}>{relationshipLabel(c.relationship)}  {displayPhone(c.phone)}</Text>
            </Pressable>
          ))}
          <Card title={t('today.bpTitle')} icon="❤️" accent="red" onPress={() => router.push('/feature/blood-pressure')}>
            {bp && bp !== 'error' ? (
              <>
                <CardValue accent="red" unit="mmHg">{bp.systolic}/{bp.diastolic}</CardValue>
                <CardNote>{t('today.bpLast', { date: date(bp.taken_at) })}</CardNote>
              </>
            ) : (
              <CardNote>{!loaded ? t('today.bpLoading') : bp === 'error' ? t('today.bpError') : t('today.bpNone')}</CardNote>
            )}
          </Card>
          <Card title={t('today.conditionsTitle')} icon="🩺" accent="blue" onPress={() => router.push('/feature/conditions')}>
            <CardNote>{t('today.conditionsNote')}</CardNote>
          </Card>
        </View>
        <TrackingSuggestions />
        <DisclaimerFooter />
        <View style={{ height: 110 }} />
      </Screen>
    </ScrollView>
  );
}
