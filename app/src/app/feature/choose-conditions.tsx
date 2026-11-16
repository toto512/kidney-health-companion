import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { BigButton, Body, DisclaimerFooter, Field, H1, Screen } from '@/components/ui';
import { CONDITION_LIST, groupByDomain, searchConditions } from '@/content/conditionList';
import { toggleId } from '@/lib/conditionSelection';
import { setFlash } from '@/lib/flash';
import { loadMyConditionIds, saveMyConditionIds } from '@/lib/userConditions';
import { font, mix, useColors } from '@/theme/tokens';

// Optional. The list is plain names only; picking one just adds a "Suggested to track" card to Today.
export default function ChooseConditions() {
  const color = useColors();
  const [saved, setSaved] = useState<string[] | null | undefined>(undefined);
  const [picked, setPicked] = useState<string[]>([]);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => { void loadMyConditionIds().then((ids) => { setSaved(ids); setPicked(ids ?? []); }); }, []);
  const groups = useMemo(() => groupByDomain(searchConditions(q)), [q]);
  const searching = q.trim() !== '';
  const nameOf = (id: string) => CONDITION_LIST.find((c) => c.id === id)?.name ?? id;

  async function save() {
    setBusy(true); setErr('');
    const ok = await saveMyConditionIds(saved ?? [], picked);
    setBusy(false);
    if (!ok) { setErr('Could not save. Try again.'); return; }
    setFlash(picked.length ? 'Conditions saved.' : 'No conditions chosen.');
    router.replace('/');
  }

  return (
    <ScrollView keyboardShouldPersistTaps="handled">
      <Screen>
        <H1>Conditions I want to track</H1>
        <Body>Only you can see this. Pick any that apply to you. It is optional, and you can change it later.</Body>
        {saved === undefined ? <Body>Loading...</Body> : null}
        {saved === null ? <Body tone="danger">Could not load your saved choices. You can still pick, but Save may not work until this is fixed.</Body> : null}
        <Field label="Search by name" value={q} onChangeText={setQ} placeholder="For example: kidney" autoCapitalize="none" autoCorrect={false} />
        {picked.length ? (
          <View style={{ gap: 6 }} accessibilityLiveRegion="polite">
            <Text style={{ fontSize: font.label, fontWeight: '700', color: color.text }}>{picked.length} chosen</Text>
            <Text style={{ fontSize: font.body, color: color.muted }}>{picked.map(nameOf).join(', ')}</Text>
          </View>
        ) : null}
        {groups.length === 0 ? <Body>Nothing matches. Try a different word.</Body> : null}
        {groups.map((g) => {
          const isOpen = searching || open.includes(g.domain);
          const n = g.items.filter((i) => picked.includes(i.id)).length;
          return (
            <View key={g.domain} style={{ gap: 8 }}>
              <Pressable accessibilityRole="button" accessibilityState={{ expanded: isOpen }} onPress={() => setOpen(toggleId(open, g.domain))}
                style={{ minHeight: 56, borderRadius: 12, borderWidth: 2, borderColor: color.accent.blue, backgroundColor: mix(color.accent.blue, color.surface, 0.06), paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <Text style={{ flex: 1, fontSize: font.label, fontWeight: '700', color: color.accent.blue }}>{g.domain}{n ? ` (${n} chosen)` : ''}</Text>
                <Text style={{ fontSize: font.label, fontWeight: '800', color: color.accent.blue }}>{isOpen ? 'Hide' : 'Show'}</Text>
              </Pressable>
              {isOpen ? g.items.map((c) => {
                const on = picked.includes(c.id);
                return (
                  <Pressable key={c.id} accessibilityRole="checkbox" accessibilityState={{ checked: on }} accessibilityLabel={c.name} onPress={() => setPicked(toggleId(picked, c.id))}
                    style={{ minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, borderWidth: 2, borderColor: on ? color.primary : color.outline, backgroundColor: on ? color.primaryTint : color.surface }}>
                    <View style={{ width: 28, height: 28, borderRadius: 6, borderWidth: 2, borderColor: on ? color.primary : color.inputBorder, backgroundColor: on ? color.primary : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                      {on ? <Text style={{ color: color.primaryText, fontWeight: '800', fontSize: 20, lineHeight: 24 }}>✓</Text> : null}
                    </View>
                    <Text style={{ flex: 1, fontSize: font.label, color: color.text }}>{c.name}</Text>
                  </Pressable>
                );
              }) : null}
            </View>
          );
        })}
        {err ? <Body tone="danger">{err}</Body> : null}
        <BigButton label={busy ? 'Saving...' : 'Save my conditions'} onPress={save} disabled={busy || saved === undefined} />
        <BigButton variant="secondary" label="Skip for now" onPress={() => router.replace('/')} />
        <DisclaimerFooter />
      </Screen>
    </ScrollView>
  );
}
