import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { color } from '@/theme/tokens';

const icon = (e: string) => () => <Text style={{ fontSize: 26 }} accessible={false}>{e}</Text>;

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: color.primary,
      tabBarInactiveTintColor: '#374151',
      tabBarLabelStyle: { fontSize: 16, fontWeight: '700' },
      tabBarStyle: { height: 76, paddingTop: 6, paddingBottom: 8 },
      tabBarItemStyle: { minHeight: 56 },
    }}>
      <Tabs.Screen name="index" options={{ title: 'Today', tabBarIcon: icon('🏠'), tabBarAccessibilityLabel: 'Today' }} />
      <Tabs.Screen name="browse" options={{ title: 'Browse', tabBarIcon: icon('🔎'), tabBarAccessibilityLabel: 'Browse' }} />
      <Tabs.Screen name="me" options={{ title: 'Profile', tabBarIcon: icon('👤'), tabBarAccessibilityLabel: 'Profile' }} />
    </Tabs>
  );
}
