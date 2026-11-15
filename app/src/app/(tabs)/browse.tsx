import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { DisclaimerFooter, H1, Screen } from '@/components/ui';
import { color, font } from '@/theme/tokens';

// Labels are UI only. No health facts are shown until content is sourced and verified.
const CATEGORIES = [
  { id: 'conditions', label: 'My conditions', icon: '🩺' },
  { id: 'medications', label: 'My medicines', icon: '💊' },
  { id: 'blood-pressure', label: 'Blood pressure', icon: '❤️' },
  { id: 'blood-results', label: 'Blood results', icon: '🩸' },
  { id: 'food', label: 'Food', icon: '🍎' },
  { id: 'tasks', label: 'Tasks', icon: '✅' },
  { id: 'appointments', label: 'Appointments', icon: '📅' },
  { id: 'contacts', label: 'Call someone', icon: '📞' },
] as const;

export default function Browse() {
  return (
    <ScrollView>
      <Screen>
        <H1>Browse</H1>
        <View style={s.grid}>
          {CATEGORIES.map((c) => (
            <Pressable key={c.id} accessibilityRole="button" accessibilityLabel={c.label} style={s.cell}
              onPress={() => router.push({ pathname: '/feature/[id]', params: { id: c.id } })}>
              <Text style={s.icon} accessible={false}>{c.icon}</Text>
              <Text style={s.label}>{c.label}</Text>
            </Pressable>
          ))}
        </View>
        <DisclaimerFooter />
      </Screen>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  cell: { flexGrow: 1, flexBasis: '45%', minHeight: 120, borderRadius: 16, borderWidth: 1, borderColor: '#D1D5DB', backgroundColor: '#F9FAFB', padding: 16, justifyContent: 'center', gap: 8 },
  icon: { fontSize: 36 },
  label: { color: color.text, fontSize: font.label, fontWeight: '700' },
});
