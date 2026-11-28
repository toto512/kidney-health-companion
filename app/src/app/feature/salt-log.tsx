import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SaltChart } from '@/components/SaltChart';
import { BigButton, Body, DisclaimerFooter, H1, Panel, Screen, Segmented } from '@/components/ui';
import { calendarDate } from '@/i18n/core';
import { useI18n } from '@/i18n/I18nProvider';
import { byDay, inWindow, localIso, SALT_RANGES, windowPoints, type SaltRange, type SaltRow } from '@/lib/saltLog';
import { deleteSalt, loadSalt } from '@/lib/saltLogData';
import { font, useColors } from '@/theme/tokens';

function SmallBtn({ label, a11y, onPress, danger }: { label: string; a11y?: string; onPress: () => void; danger?: boolean }) {
  const color = useColors();
  const c = danger ? color.danger : color.primary;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={a11y ?? label} onPress={onPress}
      style={{ minHeight: 56, minWidth: 56, paddingHorizontal: 14, borderRadius: 12, borderWidth: 2, borderColor: c, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: font.label, fontWeight: '700', color: c }}>{label}</Text>
    </Pressable>
  );
}

// Salt log. Sodium totals the person saved from Scan my plate: official table values only, with how many foods were counted and how many had no
// official number. No daily goal, no good or bad wording: the screen sends the person to their care team for what is right for them.
export default function SaltLogScreen() {
  const { t, lang } = useI18n();
  const color = useColors();
  const [rows, setRows] = useState<SaltRow[] | null | undefined>(undefined);
  const [days, setDays] = useState<SaltRange>(7);
  const [confirmDel, setConfirmDel] = useState('');
  const [err, setErr] = useState('');

  useFocusEffect(useCallback(() => { let alive = true; void loadSalt().then((r) => { if (alive) setRows(r); }); return () => { alive = false; }; }, []));

  const today = localIso(new Date());
  const view = useMemo(() => (rows ? inWindow(rows, days, today) : []), [rows, days, today]);
  const points = useMemo(() => (rows ? windowPoints(rows, days, today) : []), [rows, days, today]);
  const list = useMemo(() => byDay(view), [view]);
  const dayText = (iso: string) => calendarDate(new Date(`${iso}T12:00:00`), lang, { weekday: 'short', day: 'numeric', month: 'short' });
  const num = (n: number) => String(n);

  async function remove(id: string) {
    setErr('');
    if (await deleteSalt(id)) setRows((r) => (r ? r.filter((x) => x.id !== id) : r));
    else setErr(t('salt.errDelete'));
  }

  return (
    <ScrollView>
      <Screen>
        <H1>{t('salt.title')}</H1>
        <Body>{t('salt.intro')}</Body>
        {rows === undefined ? <Body>{t('common.loading')}</Body> : rows === null ? <Body tone="danger">{t('salt.errLoad')}</Body> : rows.length === 0 ? (
          <Panel><Body>{t('salt.empty')}</Body></Panel>
        ) : (
          <>
            <Segmented label={t('chart.range')} value={days} options={SALT_RANGES.map((d) => ({ value: d, label: t('chart.days', { n: d }) }))} onChange={(v) => setDays(v)} />
            {view.length === 0 ? <Panel><Body>{t('salt.noneInRange', { days: num(days) })}</Body></Panel> : (
              <>
                <Panel>
                  <Text accessibilityRole="header" style={{ fontSize: font.label, fontWeight: '800', color: color.text }}>{t('salt.chartTitle', { days: num(days) })}</Text>
                  <SaltChart points={points} />
                </Panel>
                {err ? <Body tone="danger">{err}</Body> : null}
                {list.map((d) => (
                  <Panel key={d.day}>
                    <Text accessibilityRole="header" style={{ fontSize: font.label, fontWeight: '800', color: color.text }}>{dayText(d.day)}</Text>
                    <Text style={{ fontSize: 30, lineHeight: 36, fontWeight: '800', color: color.accent.blue }}>
                      {d.mg}<Text style={{ fontSize: font.body, fontWeight: '600', color: color.muted }}>{` ${t('salt.mgSodium')}`}</Text>
                    </Text>
                    <Text style={{ fontSize: font.body, color: color.text }}>{t('plate.scan.totalNote', { counted: num(d.counted), of: num(d.total), missing: num(d.missing) })}</Text>
                    {d.plates.map((p, i) => (
                      <View key={p.id} style={{ gap: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: color.border }}>
                        <Text style={{ fontSize: font.body, color: color.text }}>{t('salt.plateLine', { n: num(i + 1), mg: num(p.sodium_mg), counted: num(p.foods_counted), of: num(p.foods_total) })}</Text>
                        {confirmDel === p.id ? (
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                            <SmallBtn label={t('bp.yesDelete')} danger onPress={() => { setConfirmDel(''); void remove(p.id); }} />
                            <SmallBtn label={t('people.keep')} onPress={() => setConfirmDel('')} />
                          </View>
                        ) : <SmallBtn label={t('bp.delete')} a11y={t('salt.deleteA11y', { n: num(i + 1), date: dayText(d.day) })} onPress={() => setConfirmDel(p.id)} />}
                      </View>
                    ))}
                  </Panel>
                ))}
              </>
            )}
          </>
        )}
        <Panel><Body>{t('salt.note')}</Body></Panel>
        <BigButton label={t('salt.scan')} onPress={() => router.push('/feature/plate-scan')} />
        <BigButton variant="secondary" label={t('profile.backHealth')} onPress={() => router.replace('/')} />
        <DisclaimerFooter />
      </Screen>
    </ScrollView>
  );
}
