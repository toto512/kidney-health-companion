import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { BigButton, Body, DisclaimerFooter, Field, H1, H2, Panel, Screen, Segmented } from '@/components/ui';
import { calendarDate, ltrIsolate } from '@/i18n/core';
import { remindLabel, repeatLabel, trError } from '@/i18n/labels';
import { useI18n } from '@/i18n/I18nProvider';
import { addAppointment, deleteAppointment, loadAppointments, updateAppointment } from '@/lib/appointments';
import { Appointment, buildIcs, canAddAppointment, cleanTime, icsFileName, MAX_APPOINTMENTS, MAX_APPT_NOTE, MAX_APPT_TITLE, parseKey, REMIND_OPTIONS, REPEATS, stepDate, stepTime, validateAppointment } from '@/lib/calendarLogic';
import { saveTextFile } from '@/lib/download';
import { localDateKey } from '@/lib/myDayLogic';
import { font, MIN_TOUCH, useColors } from '@/theme/tokens';

// The "file leaves the app" notice is shown once per app session, then the file is saved straight away.
let exportNoticeSeen = false;

// Add or change one appointment. Date and time use big plus and minus buttons, so nothing invalid can be typed.
export default function AppointmentScreen() {
  const { t, lang } = useI18n();
  const color = useColors();
  const { id, date } = useLocalSearchParams<{ id?: string; date?: string }>();
  const [appt, setAppt] = useState<Appointment | null>(null);
  const [ready, setReady] = useState(!id);
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [day, setDay] = useState(() => (date && parseKey(date) ? date : localDateKey(new Date())));
  const [time, setTime] = useState('09:00');
  const [repeat, setRepeat] = useState<string>('none');
  const [remind, setRemind] = useState<number>(0);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [notice, setNotice] = useState(false);
  const [saved, setSaved] = useState('');

  useEffect(() => {
    if (!id) return;
    let alive = true;
    void loadAppointments().then((all) => {
      if (!alive) return;
      const a = all?.find((x) => x.id === id);
      if (!a) { setErr(t('appt.errLoad')); return; }
      setAppt(a); setTitle(a.title); setNote(a.note ?? ''); setDay(a.starts_on); setTime(cleanTime(a.starts_at) ?? '09:00'); setRepeat(a.repeat); setRemind(a.remind_minutes); setReady(true);
    });
    return () => { alive = false; };
  }, [id]);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/feature/calendar'));

  async function save() {
    const v = validateAppointment({ title, note, date: day, time, repeat, remind });
    if (!v.ok) { setErr(trError(t, v.error)); return; }
    setBusy(true); setErr('');
    if (id) {
      const ok = await updateAppointment(id, v.value);
      setBusy(false);
      if (!ok) { setErr(t('appt.errSave')); return; }
      goBack(); return;
    }
    const all = await loadAppointments();
    if (all && !canAddAppointment(all.length)) { setBusy(false); setErr(t('appt.errLimit', { max: MAX_APPOINTMENTS })); return; }
    const r = await addAppointment(v.value);
    setBusy(false);
    if (r === 'limit') { setErr(t('appt.errLimit', { max: MAX_APPOINTMENTS })); return; }
    if (r !== 'ok') { setErr(t('appt.errSave')); return; }
    goBack();
  }
  async function remove() {
    if (!id) return;
    setBusy(true);
    const ok = await deleteAppointment(id);
    setBusy(false);
    if (!ok) { setErr(t('appt.errSave')); return; }
    goBack();
  }
  async function exportIcs() {
    if (!appt) return;
    setNotice(false); setErr('');
    exportNoticeSeen = true;
    try { await saveTextFile(icsFileName(appt), buildIcs(appt, new Date()), 'text/calendar', false); setSaved(t('appt.exportDone')); }
    catch { setErr(t('appt.errExport')); }
  }

  const stepper = (label: string, value: string, onLess: () => void, onMore: () => void) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }} accessibilityRole="adjustable" accessibilityLabel={`${label}: ${value}`}>
      <Pressable accessibilityRole="button" accessibilityLabel={t('appt.less', { unit: label })} onPress={onLess} style={btn(color)}><Text style={btnText(color)}>−</Text></Pressable>
      <View style={{ flex: 1, alignItems: 'center' }}>
        <Text style={{ fontSize: font.body, color: color.muted }}>{label}</Text>
        <Text style={{ fontSize: font.h2, fontWeight: '800', color: color.text }}>{value}</Text>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel={t('appt.more', { unit: label })} onPress={onMore} style={btn(color)}><Text style={btnText(color)}>+</Text></Pressable>
    </View>
  );

  const d = parseKey(day) ?? new Date();
  const [hh, mm] = time.split(':');
  return (
    <ScrollView>
      <Screen>
        <H1>{id ? t('appt.titleChange') : t('appt.titleAdd')}</H1>
        {err ? <Text accessibilityRole="alert" style={{ color: color.danger, fontSize: font.body, fontWeight: '600' }}>{err}</Text> : null}
        {saved ? <Text accessibilityLiveRegion="polite" style={{ color: color.text, fontSize: font.body, fontWeight: '600' }}>{saved}</Text> : null}
        {!ready ? (err ? null : <Body>{t('emergency.loading')}</Body>) : (
          <>
            <Field label={t('appt.titleLabel')} value={title} onChangeText={(v) => { setTitle(v); setErr(''); }} maxLength={MAX_APPT_TITLE} />
            <Field label={t('appt.noteLabel')} value={note} onChangeText={(v) => { setNote(v); setErr(''); }} maxLength={MAX_APPT_NOTE} multiline />
            <Panel>
              <H2>{t('appt.dateLabel')}</H2>
              <Body>{calendarDate(d, lang, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</Body>
              {stepper(t('appt.day'), String(d.getDate()), () => setDay(stepDate(day, 'day', -1)), () => setDay(stepDate(day, 'day', 1)))}
              {stepper(t('appt.month'), calendarDate(d, lang, { month: 'long' }), () => setDay(stepDate(day, 'month', -1)), () => setDay(stepDate(day, 'month', 1)))}
              {stepper(t('appt.year'), String(d.getFullYear()), () => setDay(stepDate(day, 'year', -1)), () => setDay(stepDate(day, 'year', 1)))}
            </Panel>
            <Panel>
              <H2>{t('appt.timeLabel')}</H2>
              {stepper(t('appt.hour'), ltrIsolate(hh), () => setTime(stepTime(time, 'hour', -1)), () => setTime(stepTime(time, 'hour', 1)))}
              {stepper(t('appt.minute'), ltrIsolate(mm), () => setTime(stepTime(time, 'minute', -1)), () => setTime(stepTime(time, 'minute', 1)))}
            </Panel>
            <Text style={{ fontSize: font.label, fontWeight: '600', color: color.text }}>{t('appt.repeatLabel')}</Text>
            <Segmented<string> label={t('appt.repeatLabel')} value={repeat} options={REPEATS.map((r) => ({ value: r, label: repeatLabel(t, r) }))} onChange={setRepeat} />
            {repeat === 'monthly' ? <Body>{t('appt.monthlyNote')}</Body> : null}
            <Text style={{ fontSize: font.label, fontWeight: '600', color: color.text }}>{t('appt.remindLabel')}</Text>
            <Segmented<number> label={t('appt.remindLabel')} value={remind} options={REMIND_OPTIONS.map((m) => ({ value: m, label: remindLabel(t, m) }))} onChange={setRemind} />
            <Body>{t('cal.remindersNote')}</Body>
            <BigButton label={busy ? t('appt.saving') : t('appt.save')} disabled={busy} onPress={() => void save()} />

            {appt ? (
              notice ? (
                <Panel>
                  <Body>{t('appt.exportNotice')}</Body>
                  <BigButton label={t('appt.exportContinue')} onPress={() => void exportIcs()} />
                  <BigButton variant="secondary" label={t('appt.exportCancel')} onPress={() => setNotice(false)} />
                </Panel>
              ) : <BigButton variant="secondary" label={t('appt.export')} onPress={() => (exportNoticeSeen ? void exportIcs() : setNotice(true))} />
            ) : null}

            {id ? (
              confirmDel ? (
                <Panel>
                  <Body tone="danger">{t('appt.removeAsk')}</Body>
                  <BigButton label={t('appt.yesRemove')} disabled={busy} onPress={() => void remove()} />
                  <BigButton variant="secondary" label={t('appt.keep')} onPress={() => setConfirmDel(false)} />
                </Panel>
              ) : <BigButton variant="secondary" label={t('appt.delete')} onPress={() => setConfirmDel(true)} />
            ) : null}
          </>
        )}
        <BigButton variant="secondary" label={t('appt.cancel')} onPress={goBack} />
        <DisclaimerFooter />
      </Screen>
    </ScrollView>
  );
}

const btn = (color: { primary: string }) => ({ minHeight: MIN_TOUCH, minWidth: MIN_TOUCH + 8, borderRadius: 14, borderWidth: 2, borderColor: color.primary, alignItems: 'center' as const, justifyContent: 'center' as const });
const btnText = (color: { primary: string }) => ({ fontSize: font.h2, fontWeight: '800' as const, color: color.primary });
