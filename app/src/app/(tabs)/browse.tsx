import { builtHref } from '@/lib/featureRoutes';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CategoryBadge, DisclaimerFooter, H1, H2, Screen } from '@/components/ui';
import { useI18n } from '@/i18n/I18nProvider';
import type { Key } from '@/i18n/strings/en';
import { AccentName, font, Palette, useColors } from '@/theme/tokens';

// Labels are UI only. No health facts are shown until content is sourced and verified.
const CATEGORIES: { id: string; label: Key; icon: string; accent: AccentName }[] = [
  { id: 'conditions', label: 'today.conditionsTitle', icon: '🩺', accent: 'blue' },
  { id: 'medications', label: 'cat.medications', icon: '💊', accent: 'teal' },
  { id: 'blood-pressure', label: 'today.bpTitle', icon: '❤️', accent: 'red' },
  { id: 'blood-results', label: 'cat.bloodResults', icon: '🩸', accent: 'purple' },
  { id: 'food', label: 'cat.food', icon: '🍎', accent: 'orange' },
  { id: 'tasks', label: 'cat.tasks', icon: '✅', accent: 'green' },
  { id: 'appointments', label: 'cat.appointments', icon: '📅', accent: 'indigo' },
  { id: 'my-people', label: 'today.peopleTitle', icon: '📞', accent: 'blue' },
];

export default function Browse() {
  const { t } = useI18n();
  const color = useColors();
  const s = useMemo(() => makeStyles(color), [color]);
  return (
    <ScrollView>
      <Screen>
        <H1>{t('browse.title')}</H1>
        <H2>{t('browse.categories')}</H2>
        <View style={s.grid}>
          {CATEGORIES.map((c) => (
            <Pressable key={c.id} accessibilityRole="button" accessibilityLabel={t(c.label)} style={s.cell}
              onPress={() => { const built = builtHref(c.id); if (built) router.push(built); else router.push({ pathname: '/feature/[id]', params: { id: c.id } }); }}>
              <CategoryBadge icon={c.icon} accent={c.accent} size={52} />
              <Text style={s.label}>{t(c.label)}</Text>
            </Pressable>
          ))}
        </View>
        <DisclaimerFooter />
        <View style={{ height: 110 }} />
      </Screen>
    </ScrollView>
  );
}

const makeStyles = (color: Palette) => StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  cell: { flexGrow: 1, flexBasis: '45%', minHeight: 148, borderRadius: 24, borderWidth: 1, borderColor: color.outline, backgroundColor: color.surface, padding: 16, justifyContent: 'space-between', gap: 12 },
  icon: { fontSize: 36 },
  label: { color: color.text, fontSize: font.label, lineHeight: 26, fontWeight: '800' },
});
