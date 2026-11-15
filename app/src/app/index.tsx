import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { BigButton, DisclaimerFooter, H1, Screen, Tile } from '@/components/ui';
import { supabase } from '@/lib/supabase';

// Labels here are UI only. No health facts are shown until content is sourced and verified (see plan section 3).
const TILES = [
  { id: 'emergency', label: 'Emergency', icon: '🚨' },
  { id: 'profile', label: 'My profile', icon: '👤' },
  { id: 'conditions', label: 'My conditions', icon: '🩺' },
  { id: 'medications', label: 'My medicines', icon: '💊' },
  { id: 'blood-pressure', label: 'Blood pressure', icon: '❤️' },
  { id: 'blood-results', label: 'Blood results', icon: '🩸' },
  { id: 'food', label: 'Food', icon: '🍎' },
  { id: 'tasks', label: 'Today', icon: '✅' },
  { id: 'appointments', label: 'Appointments', icon: '📅' },
  { id: 'contacts', label: 'Call someone', icon: '📞' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
] as const;

export default function Dashboard() {
  return (
    <ScrollView>
      <Screen>
        <H1>My health</H1>
        <View style={{ gap: 12 }}>
          {TILES.map((t) => (
            <Tile key={t.id} label={t.label} icon={t.icon}
              onPress={() => router.push({ pathname: '/feature/[id]', params: { id: t.id } })} />
          ))}
        </View>
        <BigButton label="Sign out" onPress={() => supabase.auth.signOut()} />
        <DisclaimerFooter />
      </Screen>
    </ScrollView>
  );
}
