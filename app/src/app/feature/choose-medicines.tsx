import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { BigButton, Body, DisclaimerFooter, Field, H1, Panel, Screen } from '@/components/ui';
import { useI18n } from '@/i18n/I18nProvider';
import { trError } from '@/i18n/labels';
import { groupMeds, medById, medLabel, searchMeds } from '@/content/medList';
import { toggleId } from '@/lib/conditionSelection';
import { addCustom, customKey, listKey, MAX_STRENGTH, normalizeStrength } from '@/lib/medSelection';
import { emptyMeds, loadMyMeds, MyMeds, saveMyMeds } from '@/lib/userMedications';
import { font, mix, useColors } from '@/theme/tokens';

// Optional strength typed by the person, as on their label. The app never suggests one.
function StrengthField({ label, value, onChange }: { label: string; value: string; onChange: (t: string) => void }) {
  const { t } = useI18n();
  return (
    <View style={{ paddingLeft: 12 }}>
      <Field label={label} value={value} onChangeText={onChange} placeholder={t('meds.example')} maxLength={MAX_STRENGTH} autoCapitalize="none" autoCorrect={false} />
    </View>
  );
}

// Optional. No schedules, and nothing is suggested from your conditions or by the app.
export default function ChooseMedicines() {
  const color = useColors();
  const { t } = useI18n();
  const [saved, setSaved] = useState<MyMeds | null | undefined>(undefined);
  const [ids, setIds] = useState<string[]>([]);
  const [custom, setCustom] = useState<string[]>([]);
  const [strengths, setStrengths] = useState<Record<string, string>>({});
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<string[]>([]);
  const [own, setOwn] = useState('');
  const [ownErr, setOwnErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => { void loadMyMeds().then((m) => { setSaved(m); setIds(m?.ids ?? []); setCustom(m?.custom ?? []); setStrengths(m?.strengths ?? {}); }); }, []);
  const groups = useMemo(() => groupMeds(searchMeds(q)), [q]);
  const searching = q.trim() !== '';
  const total = ids.length + custom.length;

  function addOwn() {
    const r = addCustom(custom, own);
    setOwnErr(r.error ? trError(t, r.error) : '');
    if (!r.error) { setCustom(r.list); setOwn(''); }
  }

  async function save() {
    setErr('');
    // Only keep a strength for a medicine that is still chosen, and check each one before anything is saved.
    const keys = [...ids.map(listKey), ...custom.map(customKey)];
    const clean: Record<string, string> = {};
    for (const k of keys) {
      const r = normalizeStrength(strengths[k] ?? '');
      if (r.error) { setErr(t('meds.errStrength', { error: trError(t, r.error) })); return; }
      if (r.value) clean[k] = r.value;
    }
    setBusy(true);
    const ok = await saveMyMeds(saved ?? emptyMeds(), { ids, custom, strengths: clean });
    setBusy(false);
    if (!ok) { setErr(t('profile.errSave')); return; }
    router.replace('/feature/medications');
  }

  return (
    <ScrollView keyboardShouldPersistTaps="handled">
      <Screen>
        <H1>{t('meds.pickTitle')}</H1>
        <Body>{t('meds.intro')}</Body>
        {saved === undefined ? <Body>{t('common.loading')}</Body> : null}
        {saved === null ? <Body tone="danger">{t('meds.errLoad')}</Body> : null}
        <Field label={t('common.searchName')} value={q} onChangeText={setQ} placeholder={t('meds.searchPlaceholder')} autoCapitalize="none" autoCorrect={false} />
        {total ? (
          <View style={{ gap: 6 }} accessibilityLiveRegion="polite">
            <Text style={{ fontSize: font.label, fontWeight: '700', color: color.text }}>{t('common.chosen', { n: total })}</Text>
          </View>
        ) : null}
        {groups.length === 0 ? <Body>{t('meds.nothing')}</Body> : null}
        {groups.map((g) => {
          const isOpen = searching || open.includes(g.group);
          const n = g.items.filter((i) => ids.includes(i.med_id)).length;
          return (
            <View key={g.group} style={{ gap: 8 }}>
              <Pressable accessibilityRole="button" accessibilityState={{ expanded: isOpen }} onPress={() => setOpen(toggleId(open, g.group))}
                style={{ minHeight: 56, borderRadius: 12, borderWidth: 2, borderColor: color.accent.teal, backgroundColor: mix(color.accent.teal, color.surface, 0.06), paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <Text style={{ flex: 1, fontSize: font.label, fontWeight: '700', color: color.accent.teal }}>{n ? t('common.chosenIn', { name: g.group, n }) : g.group}</Text>
                <Text style={{ fontSize: font.label, fontWeight: '800', color: color.accent.teal }}>{isOpen ? t('common.hide') : t('common.show')}</Text>
              </Pressable>
              {isOpen ? g.items.map((m) => {
                const on = ids.includes(m.med_id);
                return (
                  <View key={m.med_id} style={{ gap: 6 }}>
                  <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: on }} accessibilityLabel={medLabel(m)} onPress={() => setIds(toggleId(ids, m.med_id))}
                    style={{ minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, borderWidth: 2, borderColor: on ? color.primary : color.outline, backgroundColor: on ? color.primaryTint : color.surface }}>
                    <View style={{ width: 28, height: 28, borderRadius: 6, borderWidth: 2, borderColor: on ? color.primary : color.inputBorder, backgroundColor: on ? color.primary : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                      {on ? <Text style={{ color: color.primaryText, fontWeight: '800', fontSize: 20, lineHeight: 24 }}>✓</Text> : null}
                    </View>
                    <Text style={{ flex: 1, fontSize: font.label, color: color.text }}>{medLabel(m)}</Text>
                  </Pressable>
                  {on ? <StrengthField label={t('meds.strengthOf', { name: m.generic })} value={strengths[listKey(m.med_id)] ?? ''} onChange={(t) => setStrengths({ ...strengths, [listKey(m.med_id)]: t })} /> : null}
                  </View>
                );
              }) : null}
            </View>
          );
        })}
        <Panel>
          <Text accessibilityRole="header" style={{ fontSize: font.label, fontWeight: '800', color: color.text }}>{t('meds.notListed')}</Text>
          <Field label={t('meds.name')} value={own} onChangeText={(t) => { setOwn(t); setOwnErr(''); }} placeholder={t('meds.typeName')} maxLength={100} onSubmitEditing={addOwn} />
          {ownErr ? <Body tone="danger">{ownErr}</Body> : null}
          <BigButton variant="secondary" label={t('meds.addName')} onPress={addOwn} disabled={!own.trim()} />
          {custom.map((c) => (
            <View key={c} style={{ gap: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ flex: 1, fontSize: font.label, color: color.text }}>{c}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel={t('meds.removeA11y', { name: c })} onPress={() => setCustom(custom.filter((x) => x !== c))}
                style={{ minHeight: 44, minWidth: 44, paddingHorizontal: 12, borderRadius: 10, borderWidth: 2, borderColor: color.primary, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: font.body, fontWeight: '700', color: color.primary }}>{t('meds.remove')}</Text>
              </Pressable>
            </View>
            <StrengthField label={t('meds.strengthOf', { name: c })} value={strengths[customKey(c)] ?? ''} onChange={(t) => setStrengths({ ...strengths, [customKey(c)]: t })} />
            </View>
          ))}
        </Panel>
        {err ? <Body tone="danger">{err}</Body> : null}
        <BigButton label={busy ? t('profile.saving') : t('meds.save')} onPress={save} disabled={busy || saved === undefined} />
        <BigButton variant="secondary" label={t('common.skip')} onPress={() => router.replace('/')} />
        <DisclaimerFooter />
      </Screen>
    </ScrollView>
  );
}
