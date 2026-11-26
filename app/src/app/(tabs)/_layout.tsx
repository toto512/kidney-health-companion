import { Tabs } from 'expo-router';
import { useWindowDimensions } from 'react-native';
import { TabIcon, TabIconName } from '@/components/TabIcon';
import { useI18n } from '@/i18n/I18nProvider';
import { mix, useColors } from '@/theme/tokens';

const makeIcon = (size: number) => (name: TabIconName) => ({ color, focused }: { color: unknown; focused: boolean }) => <TabIcon name={name} color={String(color)} size={size} focused={focused} />;

// A floating pill bar: icon over label, the selected tab sits on a soft pill. Screens leave 120 px at the bottom so nothing hides behind it.
export default function TabsLayout() {
  const color = useColors();
  const { t } = useI18n();
  const icon = makeIcon(useWindowDimensions().width < 400 ? 26 : 30);
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: color.primary,
      tabBarInactiveTintColor: color.muted,
      tabBarActiveBackgroundColor: mix(color.primary, color.surface, 0.14),
      tabBarLabelStyle: { fontSize: 16, fontWeight: '700' },
      tabBarStyle: {
        position: 'absolute', left: 20, right: 20, bottom: 16, height: 84, borderRadius: 42, paddingHorizontal: 6, paddingBottom: 0,
        backgroundColor: mix('#FFFFFF', color.surface, color.bg === '#000000' ? 0.1 : 0), borderWidth: 0, borderTopWidth: 0,
        shadowColor: color.shadow, shadowOpacity: 0.22, shadowRadius: 24, shadowOffset: { width: 0, height: 10 }, elevation: 12,
      },
      tabBarItemStyle: { minHeight: 60, borderRadius: 34, overflow: 'hidden', marginVertical: 6, marginHorizontal: 2, paddingVertical: 4 },
    }}>
      <Tabs.Screen name="index" options={{ title: t('tab.today'), tabBarIcon: icon('home'), tabBarAccessibilityLabel: t('tab.today') }} />
      <Tabs.Screen name="browse" options={{ title: t('tab.browse'), tabBarIcon: icon('grid'), tabBarAccessibilityLabel: t('tab.browse') }} />
      <Tabs.Screen name="me" options={{ title: t('tab.profile'), tabBarIcon: icon('person'), tabBarAccessibilityLabel: t('tab.profile') }} />
    </Tabs>
  );
}
