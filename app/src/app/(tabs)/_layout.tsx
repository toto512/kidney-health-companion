import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useColors } from '@/theme/tokens';

const icon = (e: string) => () => <Text style={{ fontSize: 26 }} accessible={false}>{e}</Text>;

export default function TabsLayout() {
  const color = useColors();
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: color.primary,
      tabBarInactiveTintColor: color.muted,
      tabBarLabelStyle: { fontSize: 18, fontWeight: '700' },
      tabBarStyle: { backgroundColor: color.surface, borderTopColor: color.border, height: 84, paddingTop: 6, paddingBottom: 8 },
      tabBarItemStyle: { minHeight: 56 },
    }}>
      <Tabs.Screen name="index" options={{ title: 'Today', tabBarIcon: icon('🏠'), tabBarAccessibilityLabel: 'Today' }} />
      <Tabs.Screen name="browse" options={{ title: 'Browse', tabBarIcon: icon('🔎'), tabBarAccessibilityLabel: 'Browse' }} />
      <Tabs.Screen name="me" options={{ title: 'Profile', tabBarIcon: icon('👤'), tabBarAccessibilityLabel: 'Profile' }} />
    </Tabs>
  );
}
