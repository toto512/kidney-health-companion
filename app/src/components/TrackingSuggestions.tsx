import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { BigButton, Body, H2, Panel, SectionHeader } from '@/components/ui';
import { conditionById } from '@/content/conditionList';
import { useI18n } from '@/i18n/I18nProvider';
import { loadMyConditionIds } from '@/lib/userConditions';
import { font, useColors } from '@/theme/tokens';

// A blood pressure log and a salt log exist so far. Every other prompt is shown as "coming soon", with no sample data.
const isBpPrompt = (t: string) => /blood pressure/i.test(t);
export const isSaltPrompt = (t: string) => /^salt in your food$/i.test(t.trim());

export function TrackingSuggestions() {
  const color = useColors();
  const { t } = useI18n();
  const [ids, setIds] = useState<string[] | null | undefined>(undefined);
  useFocusEffect(useCallback(() => { let alive = true; void loadMyConditionIds().then((v) => { if (alive) setIds(v); }); return () => { alive = false; }; }, []));

  if (ids === undefined || ids === null) return null; // quiet on load failure: Today still works without it
  const chosen = ids.map(conditionById).filter((c) => !!c);
  return (
    <View style={{ gap: 16 }}>
      <H2>{t('sugg.title')}</H2>
      {chosen.length === 0 ? (
        <Panel>
          <Body>{t('sugg.pick')}</Body>
          <BigButton variant="secondary" label={t('sugg.choose')} onPress={() => router.push('/feature/choose-conditions')} />
        </Panel>
      ) : (
        <>
          {chosen.map((c) => c && (
            <Panel key={c.id}>
              <SectionHeader icon="📋" accent="indigo">{c.name}</SectionHeader>
              <Body>{t('sugg.things')}</Body>
              {c.track.map((item) => (
                <View key={item} style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
                  <Text accessible={false} style={{ fontSize: font.body, color: color.muted }}>•</Text>
                  <Text style={{ flex: 1, fontSize: font.body, lineHeight: 26, color: color.text }}>{item}{isBpPrompt(item) || isSaltPrompt(item) ? '' : t('sugg.soon')}</Text>
                </View>
              ))}
              {c.bp ? <BigButton variant="secondary" label={t('sugg.openBp')} onPress={() => router.push('/feature/blood-pressure')} /> : null}
              {c.track.some(isSaltPrompt) ? <BigButton variant="secondary" label={t('sugg.openSalt')} onPress={() => router.push('/feature/salt-log')} /> : null}
            </Panel>
          ))}
          <Text style={{ fontSize: font.body, color: color.muted }}>{t('sugg.note')}</Text>
          <BigButton variant="secondary" label={t('sugg.change')} onPress={() => router.push('/feature/choose-conditions')} />
        </>
      )}
    </View>
  );
}
