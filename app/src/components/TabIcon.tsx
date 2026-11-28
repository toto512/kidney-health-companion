import { View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

export type TabIconName = 'home' | 'grid' | 'person';

// Own line icons (24 px grid, rounded strokes) drawn in the tab colour. Not copied from any other app.
export function TabIcon({ name, color, size, focused }: { name: TabIconName; color: string; size: number; focused: boolean }) {
  const p = { stroke: color, strokeWidth: focused ? 2.4 : 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  return (
    <View accessible={false} importantForAccessibility="no-hide-descendants">
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'home' ? (<><Path d="M3 11.5 12 4l9 7.5" {...p} /><Path d="M5.5 10v10h4.5v-5.5h4V20h4.5V10" {...p} /></>) : null}
      {name === 'grid' ? (<><Rect x="3.5" y="3.5" width="7" height="7" rx="2" {...p} /><Rect x="13.5" y="3.5" width="7" height="7" rx="2" {...p} /><Rect x="3.5" y="13.5" width="7" height="7" rx="2" {...p} /><Rect x="13.5" y="13.5" width="7" height="7" rx="2" {...p} /></>) : null}
      {name === 'person' ? (<><Circle cx="12" cy="8" r="4" {...p} /><Path d="M4.5 20.5c0-3.9 3.4-6.5 7.5-6.5s7.5 2.6 7.5 6.5" {...p} /></>) : null}
    </Svg>
    </View>
  );
}
