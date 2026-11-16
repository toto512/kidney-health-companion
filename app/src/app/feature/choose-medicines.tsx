import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { BigButton, Body, DisclaimerFooter, Field, H1, Panel, Screen } from '@/components/ui';
import { groupMeds, medById, medLabel, searchMeds } from '@/content/medList';
import { toggleId } from '@/lib/conditionSelection';
import { addCustom } from '@/lib/medSelection';
import { loadMyMeds, MyMeds, saveMyMeds } from '@/lib/userMedications';
import { font, mix, useColors } from '@/theme/tokens';

// Optional. Names only: no doses, no schedules, and nothing is suggested from your conditions.
export default function ChooseMedicines() {
  const color = useColors();
  const [saved, setSaved] = useState<MyMeds | null | undefined>(undefined);
  const [ids, setIds] = useState<string[]>([]);
  const [custom, setCustom] = useState<string[]>([]);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<string[]>([]);
  const [own, setOwn] = useState('');
  const [ownErr, setOwnErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => { void loadMyMeds().then((m) => { setSaved(m); setIds(m?.ids ?? []); setCustom(m?.custom ?? []); }); }, []);
  const groups = useMemo(() => groupMeds(searchMeds(q)), [q]);
  const searching = q.trim() !== '';
  const total = ids.length + custom.length;

  function addOwn() {
    const r = addCustom(custom, own);
    setOwnErr(r.error ?? '');
    if (!r.error) { setCustom(r.list); setOwn(''); }
  }

  async function save() {
    setBusy(true); setErr('');
    const ok = await saveMyMeds(saved ?? { ids: [], custom: [] }, { ids, custom });
    setBusy(false);
    if (!ok) { setErr('Could not save. Try again.'); return; }
    router.replace('/feature/medications');
  }

  return (
    <ScrollView keyboardShouldPersistTaps="handled">
      <Screen>
        <H1>Medicines I take</H1>
        <Body>Only you can see this. Pick the medicines you take, or skip for now. We save names only.</Body>
        {saved === undefined ? <Body>Loading...</Body> : null}
        {saved === null ? <Body tone="danger">Could not load your saved medicines. You can still pick, but Save may not work until this is fixed.</Body> : null}
        <Field label="Search by name" value={q} onChangeText={setQ} placeholder="Generic or brand name" autoCapitalize="none" autoCorrect={false} />
        {total ? (
          <View style={{ gap: 6 }} accessibilityLiveRegion="polite">
            <Text style={{ fontSize: font.label, fontWeight: '700', color: color.text }}>{total} chosen</Text>
          </View>
        ) : null}
        {groups.length === 0 ? <Body>Nothing matches. You can add your own name below.</Body> : null}
        {groups.map((g) => {
          const isOpen = searching || open.includes(g.group);
          const n = g.items.filter((i) => ids.includes(i.med_id)).length;
          return (
            <View key={g.group} style={{ gap: 8 }}>
              <Pressable accessibilityRole="button" accessibilityState={{ expanded: isOpen }} onPress={() => setOpen(toggleId(open, g.group))}
                style={{ minHeight: 56, borderRadius: 12, borderWidth: 2, borderColor: color.accent.teal, backgroundColor: mix(color.accent.teal, color.surface, 0.06), paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <Text style={{ flex: 1, fontSize: font.label, fontWeight: '700', color: color.accent.teal }}>{g.group}{n ? ` (${n} chosen)` : ''}</Text>
                <Text style={{ fontSize: font.label, fontWeight: '800', color: color.accent.teal }}>{isOpen ? 'Hide' : 'Show'}</Text>
              </Pressable>
              {isOpen ? g.items.map((m) => {
                const on = ids.includes(m.med_id);
                return (
                  <Pressable key={m.med_id} accessibilityRole="checkbox" accessibilityState={{ checked: on }} accessibilityLabel={medLabel(m)} onPress={() => setIds(toggleId(ids, m.med_id))}
                    style={{ minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, borderWidth: 2, borderColor: on ? color.primary : color.outline, backgroundColor: on ? color.primaryTint : color.surface }}>
                    <View style={{ width: 28, height: 28, borderRadius: 6, borderWidth: 2, borderColor: on ? color.primary : color.inputBorder, backgroundColor: on ? color.primary : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                      {on ? <Text style={{ color: color.primaryText, fontWeight: '800', fontSize: 20, lineHeight: 24 }}>✓</Text> : null}
                    </View>
                    <Text style={{ flex: 1, fontSize: font.label, color: color.text }}>{medLabel(m)}</Text>
                  </Pressable>
                );
              }) : null}
            </View>
          );
        })}
        <Panel>
          <Text accessibilityRole="header" style={{ fontSize: font.label, fontWeight: '800', color: color.text }}>Not listed? Add your own name</Text>
          <Field label="Medicine name" value={own} onChangeText={(t) => { setOwn(t); setOwnErr(''); }} placeholder="Type the name" maxLength={100} onSubmitEditing={addOwn} />
          {ownErr ? <Body tone="danger">{ownErr}</Body> : null}
          <BigButton variant="secondary" label="Add this name" onPress={addOwn} disabled={!own.trim()} />
          {custom.map((c) => (
            <View key={c} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ flex: 1, fontSize: font.label, color: color.text }}>{c}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${c}`} onPress={() => setCustom(custom.filter((x) => x !== c))}
                style={{ minHeight: 44, minWidth: 44, paddingHorizontal: 12, borderRadius: 10, borderWidth: 2, borderColor: color.primary, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: font.body, fontWeight: '700', color: color.primary }}>Remove</Text>
              </Pressable>
            </View>
          ))}
        </Panel>
        {err ? <Body tone="danger">{err}</Body> : null}
        <BigButton label={busy ? 'Saving...' : 'Save my medicines'} onPress={save} disabled={busy || saved === undefined} />
        <BigButton variant="secondary" label="Skip for now" onPress={() => router.replace('/')} />
        <DisclaimerFooter />
      </Screen>
    </ScrollView>
  );
}
