import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Select } from '@/components/Select';
import { BigButton, Body, DisclaimerFooter, H1, Panel, Screen, Segmented, SectionHeader } from '@/components/ui';
import { WeightChart } from '@/components/WeightChart';
import { useI18n } from '@/i18n/I18nProvider';
import { dateTimeText } from '@/i18n/bpText';
import { localeTag } from '@/i18n/core';
import { formatWeight, isUnit, jumpsFromLast, parseWeight, TENTH_OPTIONS, WEIGHT_LIMITS, wholeOptions, type WeightUnit } from '@/lib/weight';
import type { WeightRow } from '@/lib/weightChart';
import { supabase } from '@/lib/supabase';
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

// Stores and lists weights only. No target weight, no good or bad labels, no advice.
export default function BodyWeight() {
  const color = useColors();
  const { t, lang } = useI18n();
  const loc = localeTag(lang);
  const [rows, setRows] = useState<WeightRow[]>([]);
  const [unit, setUnit] = useState<WeightUnit>('kg');
  const [unitChosen, setUnitChosen] = useState(false);
  const [whole, setWhole] = useState('');
  const [tenth, setTenth] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState('');
  const [confirmDel, setConfirmDel] = useState('');

  const wholeOpts = useMemo(() => wholeOptions(unit), [unit]);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('weight_readings').select('id,weight_kg,entered_unit,taken_at').order('taken_at', { ascending: false }).limit(400);
    if (error) { setErr(t('weight.errLoad')); return; }
    const list: WeightRow[] = (data ?? []).map((r) => ({ id: r.id, weight_kg: Number(r.weight_kg), entered_unit: isUnit(r.entered_unit) ? r.entered_unit : 'kg', taken_at: r.taken_at }));
    setRows(list);
    // Start in the unit the person used last, until they pick one here.
    if (!unitChosen && list[0]) setUnit(list[0].entered_unit);
  }, [unitChosen]);
  useEffect(() => { void load(); }, [load]);

  function pickUnit(u: WeightUnit) {
    setUnit(u); setUnitChosen(true);
    setWhole(''); setTenth(''); setConfirm(''); setErr(''); // the numbers differ per unit: start again rather than guess
  }

  async function save() {
    setErr('');
    const r = parseWeight(unit, whole, tenth);
    if (!r.ok) {
      setConfirm('');
      setErr(r.error === 'missing' ? t('weight.errMissing') : t('weight.errRange', { min: WEIGHT_LIMITS[unit].min, max: WEIGHT_LIMITS[unit].max, unit }));
      return;
    }
    // First press on a weight far from the last one shows the prompt; pressing again with the same number saves it.
    const key = `${r.value.kg}`;
    if (jumpsFromLast(r.value.kg, rows[0]?.weight_kg) && confirm !== key) {
      setConfirm(key);
      setErr(t('weight.errCheck', { weight: formatWeight(r.value.kg, unit, loc), unit }));
      return;
    }
    setConfirm('');
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from('weight_readings').insert({ user_id: u.user?.id, weight_kg: r.value.kg, entered_unit: unit });
    setBusy(false);
    if (error) { setErr(t('profile.errSave')); return; }
    setWhole(''); setTenth('');
    await load();
  }

  async function remove(id: string) {
    const { error } = await supabase.from('weight_readings').delete().eq('id', id);
    if (error) { setErr(t('weight.errDelete')); return; }
    await load();
  }

  return (
    <ScrollView>
      <Screen>
        <H1>{t('weight.title')}</H1>
        <Panel>
          <SectionHeader icon="⚖️" accent="blue">{t('weight.add')}</SectionHeader>
          <Body>{t('weight.choose')}</Body>
          <Segmented label={t('weight.unit')} value={unit} options={[{ value: 'kg', label: t('weight.kg') }, { value: 'lb', label: t('weight.lb') }]} onChange={pickUnit} />
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
            <Select label={`${t('weight.whole')} (${unit})`} value={whole} options={wholeOpts} onChange={(v) => { setWhole(v); setConfirm(''); }} placeholder="--" searchLabel={t('weight.number')} width={160} valueSize={24} />
            <Select label={t('weight.tenth')} value={tenth} options={TENTH_OPTIONS} onChange={(v) => { setTenth(v); setConfirm(''); }} placeholder=".0" searchLabel={t('weight.number')} searchable={false} width={120} valueSize={24} />
          </View>
          {err ? <Body tone="danger">{err}</Body> : null}
          <BigButton label={busy ? t('profile.saving') : t('weight.save')} onPress={save} disabled={busy || !whole} />
        </Panel>
        <Panel>
          <SectionHeader icon="📈" accent="blue">{t('weight.chart')}</SectionHeader>
          <WeightChart rows={rows} unit={unit} />
        </Panel>
        <SectionHeader icon="📋" accent="blue">{t('weight.list')}</SectionHeader>
        {rows.length === 0 ? <Body>{t('weight.none')}</Body> : null}
        {rows.slice(0, 30).map((r) => (
          <View key={r.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 14, borderWidth: 1, borderColor: color.outline, backgroundColor: color.surface }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 30, lineHeight: 36, fontWeight: '800', color: color.accent.blue }}>{formatWeight(r.weight_kg, unit, loc)}<Text style={{ fontSize: font.body, fontWeight: '600', color: color.muted }}> {unit}</Text></Text>
              <Text style={{ fontSize: font.body, color: color.muted }}>{dateTimeText(r.taken_at, lang)}</Text>
            </View>
            {confirmDel === r.id ? (
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <SmallBtn label={t('bp.yesDelete')} danger onPress={() => { setConfirmDel(''); void remove(r.id); }} />
                <SmallBtn label={t('people.keep')} onPress={() => setConfirmDel('')} />
              </View>
            ) : <SmallBtn label={t('bp.delete')} a11y={t('weight.deleteA11y')} onPress={() => setConfirmDel(r.id)} />}
          </View>
        ))}
        <Body>{t('weight.showDoctor')}</Body>
        <BigButton variant="secondary" label={t('profile.backHealth')} onPress={() => router.replace('/')} />
        <DisclaimerFooter />
      </Screen>
    </ScrollView>
  );
}
