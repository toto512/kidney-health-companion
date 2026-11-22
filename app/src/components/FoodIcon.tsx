import { SvgXml } from 'react-native-svg';
import { View } from 'react-native';
import { foodIcon, ICON_SVG, TILE_ICON } from '@/content/foodIcons';
import type { Food, FoodGroup } from '@/content/foods';
import { useColors } from '@/theme/tokens';

// Colour picture beside a food or group name (Twemoji, CC BY 4.0, credited on the Food page). The name next to it stays the accessible name, so this is hidden from screen readers.
export function FoodIcon({ food, tile, size = 48 }: { food?: Pick<Food, 'name' | 'group' | 'sub'>; tile?: FoodGroup; size?: number }) {
  const color = useColors();
  const key = tile ? TILE_ICON[tile] : food ? foodIcon(food).key : '';
  const xml = ICON_SVG[key];
  if (!xml) return null;
  const inner = Math.round(size * 0.74);
  return (
    <View accessible={false} importantForAccessibility="no-hide-descendants" aria-hidden
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color.surface, borderWidth: 1, borderColor: color.border, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <SvgXml xml={xml} width={inner} height={inner} />
    </View>
  );
}
