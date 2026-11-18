import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { Select } from '@/components/Select';
import { UploadButtons } from '@/components/UploadButtons';
import { BigButton, Body, DisclaimerFooter, Field, H1, Panel, Screen } from '@/components/ui';
import { useI18n } from '@/i18n/I18nProvider';
import type { Key } from '@/i18n/strings/en';
import { longDate } from '@/i18n/core';
import { readCollectionDate, readLabName } from '@/lib/labMeta';
import { readLabText } from '@/lib/labReader';
import { findDuplicate, signature } from '@/lib/labDuplicate';
import { loadReports, saveReport, FILE_EXT, MAX_BYTES, type SaveError } from '@/lib/labData';
import { checkEntry, TESTS, testDef, type TestKey } from '@/lib/labTests';
import { ocrSupported, readTextFromFile } from '@/lib/ocr';
import { font, useColors } from '@/theme/tokens';

type Row = { key: number; test: TestKey | ''; value: string; unit: string; read: string };
type File = { uri: string; mime: string };
const SAVE_ERR: Record<SaveError, Key> = { signin: 'lab.errSignedOut', fileType: 'lab.errFileType', fileSize: 'lab.errFileSize', upload: 'lab.errUpload', save: 'lab.errSave' };
let nextKey = 1;

// Pick or photograph a lab sheet, read it on this device, then show every number beside the original. Nothing is saved until the person presses Save.
export default function AddBloodTest() {
  const { t, lang } = useI18n();
  const color = useColors();
  const [step, setStep] = useState<'choose' | 'reading' | 'confirm'>('choose');
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [date, setDate] = useState('');
  const [lab, setLab] = useState('');
  const [dateRead, setDateRead] = useState(false);
  const [labRead, setLabRead] = useState(false);
  const [ambig, setAmbig] = useState<{ raw: string; dayFirst: string; monthFirst: string } | null>(null);
  const [dup, setDup] = useState<string | null>(null); // collection date of the saved report that looks the same
  const okSig = useRef('');
  const dupSig = useRef('');
  const [progress, setProgress] = useState(0);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const testOptions = useMemo(() => TESTS.map((d) => ({ value: d.key, label: t(`lab.t.${d.key}` as Key) })), [t]);

  async function take(asset: { uri: string; mimeType?: string | null; fileSize?: number | null } | undefined) {
    if (!asset) return;
    const mime = asset.mimeType ?? '';
    if (!FILE_EXT[mime]) { setErr(t('lab.errFileType')); return; }
    if (asset.fileSize && asset.fileSize > MAX_BYTES) { setErr(t('lab.errFileSize')); return; }
    setErr(''); setMsg(''); setDate(''); setLab(''); setDateRead(false); setLabRead(false); setAmbig(null);
    setFile({ uri: asset.uri, mime });
    if (!ocrSupported) { setMsg(t('lab.unsupported')); setRows([]); setStep('confirm'); return; }
    setStep('reading'); setProgress(0);
    const r = await readTextFromFile(asset.uri, mime, setProgress);
    if (!r.ok) { setMsg(t('lab.readFailed')); setRows([]); setStep('confirm'); return; }
    const found = readLabText(r.text);
    // Suggestions only: shown on the confirm screen, and the person can change them. Unclear dates stay empty.
    const dr = readCollectionDate(r.text, new Date());
    if (dr.kind === 'iso') { setDate(dr.value); setDateRead(true); } else if (dr.kind === 'ambiguous') setAmbig(dr);
    const ln = readLabName(r.text);
    if (ln) { setLab(ln); setLabRead(true); }
    setMsg(found.length ? '' : t('lab.noneFound'));
    setRows(found.map((c) => ({ key: nextKey++, test: c.test, value: c.value, unit: c.unit, read: c.value })));
    setStep('confirm');
  }

  async function pickFile() {
    const res = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'], copyToCacheDirectory: true, multiple: false });
    if (!res.canceled) await take(res.assets[0]);
  }
  async function camera() {
    const res = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!res.canceled) await take(res.assets[0]);
  }
  function typeIt() { setFile(null); setMsg(''); setRows([{ key: nextKey++, test: '', value: '', unit: '', read: '' }]); setStep('confirm'); }

  const setRow = (key: number, p: Partial<Row>) => { setDup(null); setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...p } : r))); };

  async function save() {
    setErr('');
    if (rows.length === 0) { setErr(t('lab.errNone')); return; }
    const today = new Date();
    const values = [];
    const seen = new Set<string>();
    for (const r of rows) {
      if (!r.test) { setErr(t('lab.errTest')); return; }
      if (seen.has(r.test)) { setErr(t('lab.errDup')); return; }
      seen.add(r.test);
      const c = checkEntry(r.test, r.value, r.unit, date.trim(), today);
      if (!c.ok) { setErr(t(c.error === 'date' ? 'lab.errDate' : c.error === 'unit' ? 'lab.errUnit' : 'lab.errValue')); return; }
      values.push({ test: r.test as TestKey, value: c.value, unit: c.unit, corrected: r.read !== '' && r.read !== r.value.trim().replace(',', '.') });
    }
    // Same date and the same values as a saved report: ask once. Nothing is deleted or blocked, and "Save anyway" saves normally.
    const sig = signature(date.trim(), values);
    if (okSig.current !== sig) {
      setBusy(true);
      const saved = await loadReports();
      setBusy(false);
      const match = saved ? findDuplicate(saved, date.trim(), values) : null;
      if (match) { setDup(match.taken_on); okSig.current = ''; dupSig.current = sig; return; }
    }
    setDup(null);
    setBusy(true);
    const res = await saveReport({ takenOn: date.trim(), lab, file, values });
    setBusy(false);
    if (!res.ok) { setErr(t(SAVE_ERR[res.error])); return; }
    router.replace('/feature/blood-results');
  }

  return (
    <ScrollView>
      <Screen>
        <H1>{t('lab.addTitle')}</H1>
        {step === 'choose' ? (
          <Panel>
            <Body>{t('lab.intro')}</Body>
            <UploadButtons onFile={() => void pickFile()} onCamera={() => void camera()} />
            <BigButton label={t('lab.typeIt')} variant="secondary" onPress={typeIt} />
            {err ? <Body tone="danger">{err}</Body> : null}
          </Panel>
        ) : null}
        {step === 'reading' ? <Panel><Body>{t('lab.reading', { n: Math.round(progress * 100) })}</Body></Panel> : null}
        {step === 'confirm' ? (
          <>
            <Body>{t('lab.confirmIntro')}</Body>
            {msg ? <Body>{msg}</Body> : null}
            {file ? (
              <Panel>
                <Text accessibilityRole="header" style={{ fontSize: font.label, fontWeight: '700', color: color.text }}>{t('lab.original')}</Text>
                {file.mime === 'application/pdf'
                  ? <Body>{t('lab.noPreview')}</Body>
                  : <Image accessibilityLabel={t('lab.original')} source={{ uri: file.uri }} resizeMode="contain" style={{ width: '100%', height: 320, borderRadius: 8, backgroundColor: color.surface }} />}
                {file.mime === 'application/pdf' ? <BigButton variant="secondary" label={t('lab.openOriginal')} onPress={() => { if (typeof window !== 'undefined') window.open(file.uri, '_blank', 'noopener,noreferrer'); }} /> : null}
              </Panel>
            ) : null}
            <Panel>
              {ambig ? (
                <View style={{ gap: 8 }}>
                  <Body>{t('lab.dateAmbig', { raw: ambig.raw })}</Body>
                  <BigButton variant="secondary" label={longDate(ambig.dayFirst, lang)} onPress={() => { setDate(ambig.dayFirst); setDateRead(true); setAmbig(null); }} />
                  <BigButton variant="secondary" label={longDate(ambig.monthFirst, lang)} onPress={() => { setDate(ambig.monthFirst); setDateRead(true); setAmbig(null); }} />
                </View>
              ) : null}
              <Field label={t('lab.date')} value={date} onChangeText={(v) => { setDate(v); setErr(''); setDateRead(false); setAmbig(null); setDup(null); }} placeholder="2026-11-01" autoComplete="off" maxLength={10} inputMode="numeric" />
              {dateRead && date ? <Body>{t('lab.readNote')}</Body> : null}
              <Field label={t('lab.labName')} value={lab} onChangeText={(v) => { setLab(v); setLabRead(false); }} autoComplete="off" maxLength={80} />
              {labRead && lab ? <Body>{t('lab.readNote')}</Body> : null}
            </Panel>
            {rows.map((r) => {
              const c = r.test && r.value ? checkEntry(r.test, r.value, r.unit, '2000-01-01', new Date()) : null;
              const units = r.test ? testDef(r.test).units.map((u) => ({ value: u, label: u })) : [];
              return (
                <Panel key={r.key}>
                  <Select label={t('lab.pickTest')} value={r.test} options={testOptions} placeholder={t('lab.pickTest')} searchLabel={t('lab.pickTest')}
                    onChange={(v) => setRow(r.key, { test: v, unit: testDef(v).units.includes(r.unit) ? r.unit : testDef(v).units[0] })} />
                  <Field label={t('lab.value')} value={r.value} onChangeText={(v) => { setRow(r.key, { value: v }); setErr(''); }} inputMode="decimal" autoComplete="off" maxLength={10} />
                  {r.test ? <Select label={t('lab.unit')} value={r.unit} options={units} searchable={false} onChange={(u) => setRow(r.key, { unit: u })} /> : null}
                  {c && c.ok && c.check ? <Body tone="danger">{t('lab.lookAgain')}</Body> : null}
                  {r.read !== '' && r.read !== r.value.trim().replace(',', '.') ? <Body>{t('lab.corrected')}</Body> : null}
                  <Pressable accessibilityRole="button" accessibilityLabel={t('lab.removeRow')} onPress={() => { setDup(null); setRows((rs) => rs.filter((x) => x.key !== r.key)); }}
                    style={{ minHeight: 44, justifyContent: 'center' }}>
                    <Text style={{ fontSize: font.body, fontWeight: '700', color: color.danger }}>{t('lab.removeRow')}</Text>
                  </Pressable>
                </Panel>
              );
            })}
            <BigButton variant="secondary" label={t('lab.addRow')} onPress={() => setRows((rs) => [...rs, { key: nextKey++, test: '', value: '', unit: '', read: '' }])} />
            {err ? <Body tone="danger">{err}</Body> : null}
            {dup ? (
              <Panel tone="danger">
                <Body tone="danger">{t('lab.dupWarn', { date: longDate(dup, lang) })}</Body>
                <BigButton label={t('lab.dupSave')} onPress={() => { okSig.current = dupSig.current; setDup(null); void save(); }} disabled={busy} />
                <BigButton variant="secondary" label={t('lab.dupSkip')} onPress={() => router.replace('/feature/blood-results')} />
              </Panel>
            ) : null}
            {!dup ? <BigButton label={busy ? t('lab.saving') : t('lab.save')} onPress={() => void save()} disabled={busy} /> : null}
          </>
        ) : null}
        <BigButton variant="secondary" label={t('profile.backHealth')} onPress={() => router.replace('/')} />
        <DisclaimerFooter />
      </Screen>
    </ScrollView>
  );
}
