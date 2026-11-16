import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { BigButton, Body, H2, Panel, SectionHeader } from '@/components/ui';
import { conditionById } from '@/content/conditionList';
import { loadMyConditionIds } from '@/lib/userConditions';
import { font, useColors } from '@/theme/tokens';

// Only a blood pressure log exists so far. Every other prompt is shown as "coming soon", with no sample data.
const isBpPrompt = (t: string) => /blood pressure/i.test(t);

export function TrackingSuggestions() {
  const color = useColors();
  const [ids, setIds] = useState<string[] | null | undefined>(undefined);
  useFocusEffect(useCallback(() => { let alive = true; void loadMyConditionIds().then((v) => { if (alive) setIds(v); }); return () => { alive = false; }; }, []));

  if (ids === undefined || ids === null) return null; // quiet on load failure: Today still works without it
  const chosen = ids.map(conditionById).filter((c) => !!c);
  return (
    <View style={{ gap: 16 }}>
      <H2>Suggested to track</H2>
      {chosen.length === 0 ? (
        <Panel>
          <Body>Pick the conditions you want to keep an eye on. It is optional, and only you can see it.</Body>
          <BigButton variant="secondary" label="Choose conditions" onPress={() => router.push('/feature/choose-conditions')} />
        </Panel>
      ) : (
        <>
          {chosen.map((c) => c && (
            <Panel key={c.id}>
              <SectionHeader icon="📋" accent="indigo">{c.name}</SectionHeader>
              <Body>Things people write down for this:</Body>
              {c.track.map((t) => (
                <View key={t} style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
                  <Text accessible={false} style={{ fontSize: font.body, color: color.muted }}>•</Text>
                  <Text style={{ flex: 1, fontSize: font.body, lineHeight: 26, color: color.text }}>{t}{isBpPrompt(t) ? '' : ' (coming soon)'}</Text>
                </View>
              ))}
              {c.bp ? <BigButton variant="secondary" label="Open blood pressure log" onPress={() => router.push('/feature/blood-pressure')} /> : null}
            </Panel>
          ))}
          <Text style={{ fontSize: font.body, color: color.muted }}>These are ideas for what to write down, not advice. Your doctor, nurse or pharmacist tells you what is right for you.</Text>
          <BigButton variant="secondary" label="Change my conditions" onPress={() => router.push('/feature/choose-conditions')} />
        </>
      )}
    </View>
  );
}
