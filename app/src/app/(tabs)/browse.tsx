import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CategoryBadge, DisclaimerFooter, H1, H2, Screen } from '@/components/ui';
import { AccentName, font, Palette, useColors } from '@/theme/tokens';

// Labels are UI only. No health facts are shown until content is sourced and verified.
const CATEGORIES: { id: string; label: string; icon: string; accent: AccentName }[] = [
  { id: 'conditions', label: 'My conditions', icon: '🩺', accent: 'blue' },
  { id: 'medications', label: 'My medicines', icon: '💊', accent: 'teal' },
  { id: 'blood-pressure', label: 'Blood pressure', icon: '❤️', accent: 'red' },
  { id: 'blood-results', label: 'Blood results', icon: '🩸', accent: 'purple' },
  { id: 'food', label: 'Food', icon: '🍎', accent: 'orange' },
  { id: 'tasks', label: 'Tasks', icon: '✅', accent: 'green' },
  { id: 'appointments', label: 'Appointments', icon: '📅', accent: 'indigo' },
  { id: 'contacts', label: 'Call someone', icon: '📞', accent: 'blue' },
];

export default function Browse() {
  const color = useColors();
  const s = useMemo(() => makeStyles(color), [color]);
  return (
    <ScrollView>
      <Screen>
        <H1>Browse</H1>
        <H2>Health categories</H2>
        <View style={s.grid}>
          {CATEGORIES.map((c) => (
            <Pressable key={c.id} accessibilityRole="button" accessibilityLabel={c.label} style={s.cell}
              onPress={() => router.push({ pathname: '/feature/[id]', params: { id: c.id } })}>
              <CategoryBadge icon={c.icon} accent={c.accent} size={52} />
              <Text style={s.label}>{c.label}</Text>
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
