import { Tabs } from 'expo-router';
import { StyleSheet, Text, useWindowDimensions } from 'react-native';
import { useI18n } from '@/i18n/I18nProvider';
import { mix, useColors } from '@/theme/tokens';

const makeIcon = (size: number) => (e: string) => () => <Text style={{ fontSize: size }} accessible={false}>{e}</Text>;

// A floating pill bar: icon over label, the selected tab sits on a soft pill. Screens leave 120 px at the bottom so nothing hides behind it.
export default function TabsLayout() {
  const color = useColors();
  const { t } = useI18n();
  const icon = makeIcon(useWindowDimensions().width < 400 ? 24 : 28);
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: color.primary,
      tabBarInactiveTintColor: color.muted,
      tabBarActiveBackgroundColor: mix(color.primary, color.surface, 0.14),
      tabBarLabelStyle: { fontSize: 16, fontWeight: '700' },
      tabBarStyle: {
        position: 'absolute', left: 20, right: 20, bottom: 16, height: 84, borderRadius: 42, paddingHorizontal: 6, paddingBottom: 0,
        backgroundColor: color.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: color.border, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: color.border,
        shadowColor: color.shadow, shadowOpacity: 0.16, shadowRadius: 22, shadowOffset: { width: 0, height: 8 }, elevation: 10,
      },
      tabBarItemStyle: { minHeight: 60, borderRadius: 34, overflow: 'hidden', marginVertical: 6, marginHorizontal: 2, paddingVertical: 4 },
    }}>
      <Tabs.Screen name="index" options={{ title: t('tab.today'), tabBarIcon: icon('🏠'), tabBarAccessibilityLabel: t('tab.today') }} />
      <Tabs.Screen name="browse" options={{ title: t('tab.browse'), tabBarIcon: icon('🗂️'), tabBarAccessibilityLabel: t('tab.browse') }} />
      <Tabs.Screen name="me" options={{ title: t('tab.profile'), tabBarIcon: icon('👤'), tabBarAccessibilityLabel: t('tab.profile') }} />
    </Tabs>
  );
}
