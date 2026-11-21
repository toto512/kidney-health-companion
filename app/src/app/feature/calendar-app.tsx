import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, Text } from 'react-native';
import { BigButton, Body, DisclaimerFooter, H1, Screen, Segmented } from '@/components/ui';
import { useI18n } from '@/i18n/I18nProvider';
import { calendarAppLabel } from '@/i18n/labels';
import { loadCalendarApp, saveCalendarApp } from '@/lib/appointments';
import { CALENDAR_APPS, CalendarApp } from '@/lib/calendarApp';
import { setFlash } from '@/lib/flash';
import { font, useColors } from '@/theme/tokens';

// Which calendar the person uses. Only the answer is saved; the app does not connect to the calendar.
// `first=1` is the optional step in the first-login wizard, with a clear way to skip.
export default function CalendarAppScreen() {
  const { t } = useI18n();
  const color = useColors();
  const { first } = useLocalSearchParams<{ first?: string }>();
  const wizard = first === '1';
  const [choice, setChoice] = useState<CalendarApp | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => { let alive = true; void loadCalendarApp().then((v) => { if (alive && v) setChoice(v); }); return () => { alive = false; }; }, []);

  const finish = () => {
    if (wizard) { setFlash(t('profile.saved')); router.replace('/'); }
    else router.canGoBack() ? router.back() : router.replace('/');
  };
  async function save() {
    if (!choice) { finish(); return; }
    setBusy(true); setErr('');
    const ok = await saveCalendarApp(choice);
    setBusy(false);
    if (!ok) { setErr(t('calapp.errSave')); return; }
    finish();
  }
  return (
    <ScrollView>
      <Screen>
        <H1>{t('calapp.title')}</H1>
        <Body>{t('calapp.question')}</Body>
        <Segmented<CalendarApp> label={t('calapp.title')} value={choice as CalendarApp} options={CALENDAR_APPS.map((v) => ({ value: v, label: calendarAppLabel(t, v) }))} onChange={(v) => { setChoice(v); setErr(''); }} />
        <Body>{t('calapp.notConnected')}</Body>
        {err ? <Text accessibilityRole="alert" style={{ color: color.danger, fontSize: font.body, fontWeight: '600' }}>{err}</Text> : null}
        <BigButton label={busy ? t('appt.saving') : wizard ? t('calapp.continue') : t('appt.save')} disabled={busy || (!choice && !wizard)} onPress={() => void save()} />
        {wizard ? <BigButton variant="secondary" label={t('people.skip')} onPress={finish} /> : <BigButton variant="secondary" label={t('appt.cancel')} onPress={finish} />}
        <DisclaimerFooter />
      </Screen>
    </ScrollView>
  );
}
