import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Select } from '@/components/Select';
import { BigButton, Body, DisclaimerFooter, H1, Panel, Screen, SectionHeader } from '@/components/ui';
import { BpChart } from '@/components/BpChart';
import { UploadButtons } from '@/components/UploadButtons';
import { useI18n } from '@/i18n/I18nProvider';
import { dateTimeText } from '@/i18n/bpText';
import { trError } from '@/i18n/labels';
import { BP_LIMITS, checkReading, parseReading } from '@/lib/bp';
import { FILE_EXT, MAX_BYTES } from '@/lib/labData';
import { supabase } from '@/lib/supabase';
import { font, useColors } from '@/theme/tokens';

// Whole numbers from the lowest to the highest value the app accepts (input limits only), nothing pre-selected.
const range = ({ min, max }: { min: number; max: number }) => Array.from({ length: max - min + 1 }, (_, i) => ({ value: String(min + i), label: String(min + i) }));

const SMALL = 140;

type Row = { id: string; systolic: number; diastolic: number; pulse: number | null; taken_at: string };

function SmallBtn({ label, a11y, onPress, danger }: { label: string; a11y?: string; onPress: () => void; danger?: boolean }) {
  const color = useColors();
  const c = danger ? color.danger : color.primary;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={a11y ?? label} onPress={onPress}
      style={{ minHeight: 44, minWidth: 44, paddingHorizontal: 12, borderRadius: 10, borderWidth: 2, borderColor: c, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: font.body, fontWeight: '700', color: c }}>{label}</Text>
    </Pressable>
  );
}

// Stores and lists readings only. No Low/Medium/High labels until a sourced reference range is supplied.
export default function BloodPressure() {
  const color = useColors();
  const { t, lang } = useI18n();
  const [rows, setRows] = useState<Row[]>([]);
  const [sys, setSys] = useState('');
  const [dia, setDia] = useState('');
  const [pulse, setPulse] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState('');
  const [confirmDel, setConfirmDel] = useState('');

  const sysOptions = useMemo(() => range(BP_LIMITS.systolic), []);
  const diaOptions = useMemo(() => range(BP_LIMITS.diastolic), []);
  const pulseOptions = useMemo(() => range(BP_LIMITS.pulse), []);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('bp_readings').select('id,systolic,diastolic,pulse,taken_at').order('taken_at', { ascending: false }).limit(200);
    if (error) { setErr(t('bp.errLoad')); return; }
    setRows(data ?? []);
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function save() {
    setErr('');
    const r = parseReading(sys, dia, pulse);
    if (!r.ok) { setErr(trError(t, r.error)); setConfirm(''); return; }
    // First press on an unusual pair shows the prompt; pressing again with the same numbers saves it.
    const warn = checkReading(r.value);
    const key = `${r.value.systolic}/${r.value.diastolic}`;
    if (warn && confirm !== key) { setConfirm(key); setErr(t('err.bpCheck', { sys: r.value.systolic, dia: r.value.diastolic })); return; }
    setConfirm('');
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from('bp_readings').insert({ user_id: u.user?.id, ...r.value });
    setBusy(false);
    if (error) { setErr(t('profile.errSave')); return; }
    setSys(''); setDia(''); setPulse('');
    await load();
  }

  // Pick or photograph a page, then read it on the next screen. The picture is not uploaded or stored.
  function scan(asset: { uri: string; mimeType?: string | null; fileSize?: number | null } | undefined) {
    if (!asset) return;
    const mime = asset.mimeType ?? '';
    if (!FILE_EXT[mime]) { setErr(t('lab.errFileType')); return; }
    if (asset.fileSize && asset.fileSize > MAX_BYTES) { setErr(t('lab.errFileSize')); return; }
    setErr('');
    router.push({ pathname: '/feature/scan-blood-pressure', params: { uri: asset.uri, mime } });
  }
  async function pickFile() {
    const res = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'], copyToCacheDirectory: true, multiple: false });
    if (!res.canceled) scan(res.assets[0]);
  }

  async function remove(id: string) {
    const { error } = await supabase.from('bp_readings').delete().eq('id', id);
    if (error) { setErr(t('bp.errDelete')); return; }
    await load();
  }

  return (
    <ScrollView>
      <Screen>
        <H1>{t('today.bpTitle')}</H1>
        <Panel>
          <SectionHeader icon="❤️" accent="red">{t('bp.add')}</SectionHeader>
          <Body>{t('bp.choose')}</Body>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
            <Select label={t('bp.top')} value={sys} options={sysOptions} onChange={setSys} placeholder="--" searchLabel={t('bp.number')} width={SMALL} valueSize={24} />
            <Text accessible={false} style={{ fontSize: 32, fontWeight: '700', color: color.text, marginTop: 34, lineHeight: 56 }}>/</Text>
            <Select label={t('bp.bottom')} value={dia} options={diaOptions} onChange={setDia} placeholder="--" searchLabel={t('bp.number')} width={SMALL} valueSize={24} />
          </View>
          <Select label={t('bp.pulseOpt')} value={pulse} options={pulseOptions} onChange={setPulse} placeholder="--" searchLabel={t('bp.number')} width={SMALL} valueSize={24} />
          {err ? <Body tone="danger">{err}</Body> : null}
          <BigButton label={busy ? t('profile.saving') : t('bp.saveReading')} onPress={save} disabled={busy || !sys || !dia} />
        </Panel>
        <UploadButtons onFile={() => void pickFile()} onAsset={scan} />
        <Panel>
          <SectionHeader icon="📈" accent="red">{t('bp.chart')}</SectionHeader>
          <BpChart rows={rows} />
        </Panel>
        <SectionHeader icon="📋" accent="red">{t('bp.readings')}</SectionHeader>
        {rows.length === 0 ? <Body>{t('bp.none')}</Body> : null}
        {rows.slice(0, 30).map((r) => (
          <View key={r.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 14, borderWidth: 1, borderColor: color.outline, backgroundColor: color.surface }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 30, lineHeight: 36, fontWeight: '800', color: color.accent.red }}>{r.systolic} / {r.diastolic}<Text style={{ fontSize: font.body, fontWeight: '600', color: color.muted }}> mmHg</Text></Text>
              <Text style={{ fontSize: font.body, color: color.muted }}>{r.pulse != null ? `${t('bp.pulse', { n: r.pulse })} · ` : ''}{dateTimeText(r.taken_at, lang)}</Text>
            </View>
            {confirmDel === r.id ? (
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <SmallBtn label={t('bp.yesDelete')} danger onPress={() => { setConfirmDel(''); void remove(r.id); }} />
                <SmallBtn label={t('people.keep')} onPress={() => setConfirmDel('')} />
              </View>
            ) : <SmallBtn label={t('bp.delete')} a11y={t('bp.deleteA11y')} onPress={() => setConfirmDel(r.id)} />}
          </View>
        ))}
        <Body>{t('bp.showDoctor')}</Body>
        <BigButton variant="secondary" label={t('profile.backHealth')} onPress={() => router.replace('/')} />
        <DisclaimerFooter />
      </Screen>
    </ScrollView>
  );
}
