import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { BigButton, DisclaimerFooter, H1, Screen, Tile } from '@/components/ui';
import { supabase } from '@/lib/supabase';

export default function Me() {
  return (
    <ScrollView>
      <Screen>
        <H1>Profile</H1>
        <View style={{ gap: 12 }}>
          <Tile label="My profile" icon="👤" onPress={() => router.push('/feature/profile')} />
          <Tile label="Conditions I track" icon="📋" onPress={() => router.push('/feature/choose-conditions')} />
          <Tile label="Medicines I take" icon="💊" onPress={() => router.push('/feature/choose-medicines')} />
          <Tile label="Two-step sign-in" icon="🔐" onPress={() => router.push('/feature/two-step')} />
          <Tile label="Settings" icon="⚙️" onPress={() => router.push({ pathname: '/feature/[id]', params: { id: 'settings' } })} />
        </View>
        <BigButton variant="secondary" label="Sign out" onPress={() => supabase.auth.signOut()} />
        <DisclaimerFooter />
        <View style={{ height: 110 }} />
      </Screen>
    </ScrollView>
  );
}
