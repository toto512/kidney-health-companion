import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { BigButton, Body, DisclaimerFooter, H1, Panel, SectionHeader, Screen } from '@/components/ui';
import { useI18n } from '@/i18n/I18nProvider';
import type { Key } from '@/i18n/strings/en';
import { formatDate } from '@/i18n/core';
import { openLink, saveTextFile } from '@/lib/download';
import { labCsv } from '@/lib/labCsv';
import { deleteAllLabData, deleteReport, exportRows, loadReports, originalUrl, type LabReport } from '@/lib/labData';
import { font, useColors } from '@/theme/tokens';

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

// Lists saved blood test values exactly as the person confirmed them. No good/bad labels: official ranges are not verified yet.
export default function BloodResults() {
  const { t, lang } = useI18n();
  const color = useColors();
  const [reports, setReports] = useState<LabReport[] | null>(null);
  const [err, setErr] = useState('');
  const [note, setNote] = useState('');
  const [confirmId, setConfirmId] = useState('');
  const [confirmAll, setConfirmAll] = useState(false);

  const load = useCallback(async () => {
    const r = await loadReports();
    if (!r) { setErr(t('lab.errLoad')); return; }
    setReports(r);
  }, [t]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  async function remove(r: LabReport) {
    setErr(''); setNote('');
    if (!(await deleteReport(r))) { setErr(t('lab.errDelete')); return; }
    await load();
  }
  async function removeAll() {
    setErr(''); setNote(''); setConfirmAll(false);
    if (!(await deleteAllLabData())) { setErr(t('lab.errDelete')); return; }
    setNote(t('lab.deletedAll'));
    await load();
  }
  async function open(path: string) {
    setErr('');
    const u = await originalUrl(path);
    if (!u) { setErr(t('lab.errOpen')); return; }
    await openLink(u);
  }
  async function exportCsv() {
    setErr(''); setNote('');
    const rows = await exportRows();
    if (!rows) { setErr(t('lab.exportFailed')); return; }
    if (rows.length === 0) { setNote(t('lab.exportNone')); return; }
    await saveTextFile('blood-results.csv', labCsv(rows));
  }

  return (
    <ScrollView>
      <Screen>
        <H1>{t('lab.title')}</H1>
        <BigButton label={t('lab.add')} onPress={() => router.push('/feature/add-blood-test')} />
        <Body>{t('lab.noLabels')}</Body>
        <Body>{t('lab.keptNote')}</Body>
        {err ? <Body tone="danger">{err}</Body> : null}
        {note ? <Body>{note}</Body> : null}
        <SectionHeader icon="🩸" accent="purple">{t('lab.saved')}</SectionHeader>
        {reports && reports.length === 0 ? <Body>{t('lab.none')}</Body> : null}
        {(reports ?? []).map((r) => (
          <Panel key={r.id}>
            <Text accessibilityRole="header" style={{ fontSize: font.label, fontWeight: '800', color: color.text }}>{formatDate(r.taken_on + 'T12:00:00', lang)}{r.lab ? ` · ${r.lab}` : ''}</Text>
            {r.results.map((v) => (
              <Text key={v.id} style={{ fontSize: font.body, color: color.text }}>
                <Text style={{ fontWeight: '700' }}>{t(`lab.t.${v.test}` as Key)}</Text>{': '}{v.value} {v.unit}
              </Text>
            ))}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {r.file_path ? <SmallBtn label={t('lab.openOriginal')} onPress={() => void open(r.file_path as string)} /> : null}
              {confirmId === r.id ? (
                <>
                  <SmallBtn label={t('lab.yesDelete')} danger onPress={() => { setConfirmId(''); void remove(r); }} />
                  <SmallBtn label={t('lab.keep')} onPress={() => setConfirmId('')} />
                </>
              ) : <SmallBtn label={t('lab.delete')} a11y={t('lab.deleteA11y')} danger onPress={() => setConfirmId(r.id)} />}
            </View>
          </Panel>
        ))}
        <BigButton variant="secondary" label={t('lab.export')} onPress={() => void exportCsv()} />
        {confirmAll ? (
          <Panel tone="danger">
            <Body tone="danger">{t('lab.deleteAllAsk')}</Body>
            <BigButton label={t('lab.deleteAllYes')} onPress={() => void removeAll()} />
            <BigButton variant="secondary" label={t('lab.keep')} onPress={() => setConfirmAll(false)} />
          </Panel>
        ) : <BigButton variant="secondary" label={t('lab.deleteAll')} onPress={() => setConfirmAll(true)} />}
        <BigButton variant="secondary" label={t('profile.backHealth')} onPress={() => router.replace('/')} />
        <DisclaimerFooter />
      </Screen>
    </ScrollView>
  );
}
