import Svg, { Path } from 'react-native-svg';
import { View } from 'react-native';
import { foodIconName, ICON_PATHS } from '@/content/foodIcons';
import type { FoodGroup } from '@/content/foods';
import { useColors } from '@/theme/tokens';

// Decorative picture beside a food or group name. The name next to it stays the accessible name, so this is hidden from screen readers.
export function FoodIcon({ group, sub, size = 44 }: { group: FoodGroup; sub?: string; size?: number }) {
  const color = useColors();
  const d = ICON_PATHS[foodIconName(group, sub)];
  return (
    <View accessible={false} importantForAccessibility="no-hide-descendants" aria-hidden
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color.primaryTint, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24" accessible={false}>
        <Path d={d} fill={color.primary} />
      </Svg>
    </View>
  );
}
