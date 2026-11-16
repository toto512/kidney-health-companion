import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useI18n } from '@/i18n/I18nProvider';
import { useColors } from '@/theme/tokens';

const icon = (e: string) => () => <Text style={{ fontSize: 26 }} accessible={false}>{e}</Text>;

// A floating rounded bar. Screens leave 120 px at the bottom so nothing hides behind it.
export default function TabsLayout() {
  const color = useColors();
  const { t } = useI18n();
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: color.primary,
      tabBarInactiveTintColor: color.muted,
      tabBarActiveBackgroundColor: color.primaryTint,
      tabBarLabelStyle: { fontSize: 18, fontWeight: '700' },
      tabBarStyle: {
        position: 'absolute', left: 16, right: 16, bottom: 16, height: 80, borderRadius: 40, paddingHorizontal: 6,
        backgroundColor: color.surface, borderWidth: 1, borderColor: color.outline, borderTopWidth: 1, borderTopColor: color.outline,
        shadowColor: color.shadow, shadowOpacity: 0.18, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 8,
      },
      tabBarItemStyle: { minHeight: 56, borderRadius: 32, marginVertical: 6, marginHorizontal: 2, paddingVertical: 4 },
    }}>
      <Tabs.Screen name="index" options={{ title: t('tab.today'), tabBarIcon: icon('🏠'), tabBarAccessibilityLabel: t('tab.today') }} />
      <Tabs.Screen name="browse" options={{ title: t('tab.browse'), tabBarIcon: icon('🗂️'), tabBarAccessibilityLabel: t('tab.browse') }} />
      <Tabs.Screen name="me" options={{ title: t('tab.profile'), tabBarIcon: icon('👤'), tabBarAccessibilityLabel: t('tab.profile') }} />
    </Tabs>
  );
}
