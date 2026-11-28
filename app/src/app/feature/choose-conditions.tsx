import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { BigButton, Body, DisclaimerFooter, Field, H1, Screen } from '@/components/ui';
import { CONDITION_LIST, groupByDomain, searchConditions } from '@/content/conditionList';
import { useI18n } from '@/i18n/I18nProvider';
import { toggleId } from '@/lib/conditionSelection';
import { setFlash } from '@/lib/flash';
import { loadMyConditionIds, saveMyConditionIds } from '@/lib/userConditions';
import { font, mix, useColors } from '@/theme/tokens';

// Optional. The list is plain names only; picking one just adds a "Suggested to track" card to Today.
export default function ChooseConditions() {
  const color = useColors();
  const { t } = useI18n();
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
    if (!ok) { setErr(t('profile.errSave')); return; }
    setFlash(picked.length ? t('track.saved') : t('track.none'));
    router.replace('/');
  }

  return (
    <ScrollView keyboardShouldPersistTaps="handled">
      <Screen>
        <H1>{t('track.title')}</H1>
        <Body>{t('track.intro')}</Body>
        {saved === undefined ? <Body>{t('common.loading')}</Body> : null}
        {saved === null ? <Body tone="danger">{t('track.errLoad')}</Body> : null}
        <Field label={t('common.searchName')} value={q} onChangeText={setQ} placeholder={t('track.example')} autoCapitalize="none" autoCorrect={false} />
        {picked.length ? (
          <View style={{ gap: 6 }} accessibilityLiveRegion="polite">
            <Text style={{ fontSize: font.label, fontWeight: '700', color: color.text }}>{t('common.chosen', { n: picked.length })}</Text>
            <Text style={{ fontSize: font.body, color: color.muted }}>{picked.map(nameOf).join(', ')}</Text>
          </View>
        ) : null}
        {groups.length === 0 ? <Body>{t('common.nothingMatches')}</Body> : null}
        {groups.map((g) => {
          const isOpen = searching || open.includes(g.domain);
          const n = g.items.filter((i) => picked.includes(i.id)).length;
          return (
            <View key={g.domain} style={{ gap: 8 }}>
              <Pressable accessibilityRole="button" accessibilityState={{ expanded: isOpen }} onPress={() => setOpen(toggleId(open, g.domain))}
                style={{ minHeight: 56, paddingVertical: 8, borderRadius: 12, borderWidth: 2, borderColor: color.accent.blue, backgroundColor: mix(color.accent.blue, color.surface, 0.06), paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <Text style={{ flex: 1, fontSize: font.label, fontWeight: '700', color: color.accent.blue }}>{n ? t('common.chosenIn', { name: g.domain, n }) : g.domain}</Text>
                <Text style={{ fontSize: font.label, fontWeight: '800', color: color.accent.blue }}>{isOpen ? t('common.hide') : t('common.show')}</Text>
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
        <BigButton label={busy ? t('profile.saving') : t('track.save')} onPress={save} disabled={busy || saved === undefined} />
        <BigButton variant="secondary" label={t('common.skip')} onPress={() => router.replace('/')} />
        <DisclaimerFooter />
      </Screen>
    </ScrollView>
  );
}
