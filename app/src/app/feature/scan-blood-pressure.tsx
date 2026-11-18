import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, Text } from 'react-native';
import { BigButton, Body, DisclaimerFooter, Field, H1, Panel, Screen } from '@/components/ui';
import { useI18n } from '@/i18n/I18nProvider';
import { HelpLine } from '@/components/HelpLine';
import { checkReading, needsHelpLine, parseReading } from '@/lib/bp';
import { readBpText, takenAtFrom } from '@/lib/bpReader';
import { ocrSupported, readTextFromFile } from '@/lib/ocr';
import { supabase } from '@/lib/supabase';
import { font, useColors } from '@/theme/tokens';

type Row = { key: number; sys: string; dia: string; pulse: string; date: string; time: string; read: boolean; dateMissing: boolean };
let nextKey = 1;
const blank = (): Row => ({ key: nextKey++, sys: '', dia: '', pulse: '', date: '', time: '', read: false, dateMissing: false });

// Reads blood pressure numbers from a chosen file or picture on this device (no cloud, no AI vision), then shows every value beside the original.
// Nothing is saved until the person presses Save. The picture is only shown here and is never uploaded or stored.
export default function ScanBloodPressure() {
  const { t } = useI18n();
  const color = useColors();
  const { uri, mime } = useLocalSearchParams<{ uri?: string; mime?: string }>();
  const [step, setStep] = useState<'reading' | 'confirm'>('reading');
  const [progress, setProgress] = useState(0);
  const [rows, setRows] = useState<Row[]>([]);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [checked, setChecked] = useState('');

  useEffect(() => {
    let live = true;
    (async () => {
      if (!uri || !mime) { setErr(t('bp.scan.errMissing')); setStep('confirm'); return; }
      if (!ocrSupported) { setMsg(t('lab.unsupported')); setRows([blank()]); setStep('confirm'); return; }
      const r = await readTextFromFile(uri, mime, (p) => live && setProgress(p));
      if (!live) return;
      if (!r.ok) { setMsg(t('lab.readFailed')); setRows([blank()]); setStep('confirm'); return; }
      const found = readBpText(r.text, new Date());
      setMsg(found.length ? '' : t('bp.scan.none'));
      setRows(found.length
        ? found.map((c) => ({ key: nextKey++, sys: String(c.systolic), dia: String(c.diastolic), pulse: c.pulse === null ? '' : String(c.pulse), date: c.date ?? '', time: c.time ?? '', read: true, dateMissing: !c.date || !c.time }))
        : [blank()]);
      setStep('confirm');
    })();
    return () => { live = false; };
  }, [uri, mime, t]);

  const setRow = (key: number, p: Partial<Row>) => { setErr(''); setChecked(''); setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...p } : r))); };

  async function save() {
    setErr('');
    if (rows.length === 0) { setErr(t('bp.scan.errNone')); return; }
    const now = new Date();
    const records: { systolic: number; diastolic: number; pulse: number | null; taken_at: string }[] = [];
    let unusual = '';
    for (const r of rows) {
      const p = parseReading(r.sys, r.dia, r.pulse);
      if (!p.ok) { setErr(p.error); return; }
      const at = takenAtFrom(r.date, r.time, now);
      if (!at) { setErr(t(takenAtFrom(r.date, '00:00', now) ? 'bp.scan.errTime' : 'bp.scan.errDate')); return; }
      if (checkReading(p.value)) unusual += `${p.value.systolic}/${p.value.diastolic};`;
      records.push({ ...p.value, taken_at: at });
    }
    // Unusual numbers: ask once, and a second press with the same numbers saves them (same rule as typing a reading).
    if (unusual && checked !== unusual) { setChecked(unusual); setErr(t('bp.scan.errCheck')); return; }
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from('bp_readings').insert(records.map((r) => ({ user_id: u.user?.id, ...r })));
    setBusy(false);
    if (error) { setErr(t('bp.scan.errSave')); return; }
    router.replace('/feature/blood-pressure');
  }

  return (
    <ScrollView>
      <Screen>
        <H1>{t('bp.scan.title')}</H1>
        {step === 'reading' ? <Panel><Body>{t('bp.scan.intro')}</Body><Body>{t('lab.reading', { n: Math.round(progress * 100) })}</Body></Panel> : null}
        {step === 'confirm' ? (
          <>
            <Body>{t('bp.scan.confirmIntro')}</Body>
            {msg ? <Body>{msg}</Body> : null}
            {uri && mime ? (
              <Panel>
                <Text accessibilityRole="header" style={{ fontSize: font.label, fontWeight: '700', color: color.text }}>{t('lab.original')}</Text>
                {mime === 'application/pdf'
                  ? <><Body>{t('lab.noPreview')}</Body><BigButton variant="secondary" label={t('lab.openOriginal')} onPress={() => { if (typeof window !== 'undefined') window.open(uri, '_blank', 'noopener,noreferrer'); }} /></>
                  : <Image accessibilityLabel={t('lab.original')} source={{ uri }} resizeMode="contain" style={{ width: '100%', height: 320, borderRadius: 8, backgroundColor: color.surface }} />}
                <Body>{t('bp.scan.keep')}</Body>
              </Panel>
            ) : null}
            {rows.map((r, i) => {
              const p = r.sys && r.dia ? parseReading(r.sys, r.dia, r.pulse) : null;
              return (
                <Panel key={r.key}>
                  <Text accessibilityRole="header" style={{ fontSize: font.label, fontWeight: '700', color: color.text }}>{t('bp.scan.n', { n: i + 1 })}</Text>
                  <Field label={t('bp.top')} value={r.sys} onChangeText={(v) => setRow(r.key, { sys: v })} inputMode="numeric" autoComplete="off" maxLength={3} />
                  <Field label={t('bp.bottom')} value={r.dia} onChangeText={(v) => setRow(r.key, { dia: v })} inputMode="numeric" autoComplete="off" maxLength={3} />
                  <Field label={t('bp.pulseOpt')} value={r.pulse} onChangeText={(v) => setRow(r.key, { pulse: v })} inputMode="numeric" autoComplete="off" maxLength={3} />
                  <Field label={t('bp.scan.date')} value={r.date} onChangeText={(v) => setRow(r.key, { date: v, dateMissing: false })} placeholder="2026-11-01" inputMode="numeric" autoComplete="off" maxLength={10} />
                  <Field label={t('bp.scan.time')} value={r.time} onChangeText={(v) => setRow(r.key, { time: v, dateMissing: false })} placeholder="08:30" inputMode="numeric" autoComplete="off" maxLength={5} />
                  {r.read && !r.dateMissing ? <Body>{t('lab.readNote')}</Body> : null}
                  {r.dateMissing && (!r.date || !r.time) ? <Body>{t('bp.scan.typeIt')}</Body> : null}
                  {needsHelpLine(r.sys, r.dia, r.pulse) ? <HelpLine /> : null}
                  {p && p.ok && checkReading(p.value) ? <Body tone="danger">{t('bp.scan.lookAgain')}</Body> : null}
                  <Pressable accessibilityRole="button" accessibilityLabel={t('bp.scan.remove')} onPress={() => { setErr(''); setChecked(''); setRows((rs) => rs.filter((x) => x.key !== r.key)); }} style={{ minHeight: 44, justifyContent: 'center' }}>
                    <Text style={{ fontSize: font.body, fontWeight: '700', color: color.danger }}>{t('bp.scan.remove')}</Text>
                  </Pressable>
                </Panel>
              );
            })}
            <BigButton variant="secondary" label={t('bp.scan.add')} onPress={() => setRows((rs) => [...rs, blank()])} />
            {err ? <Body tone="danger">{err}</Body> : null}
            <BigButton label={busy ? t('profile.saving') : t('bp.scan.save')} onPress={() => void save()} disabled={busy || rows.length === 0} />
          </>
        ) : null}
        <BigButton variant="secondary" label={t('profile.backHealth')} onPress={() => router.replace('/feature/blood-pressure')} />
        <DisclaimerFooter />
      </Screen>
    </ScrollView>
  );
}
