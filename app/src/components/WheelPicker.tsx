import { useEffect, useRef } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, Platform, Pressable, ScrollView, ScrollViewInstance, Text, View } from 'react-native';
import { indexFromOffset, indexOfValue, offsetForIndex, rowHeight, WheelItem } from '@/lib/wheelLogic';
import { font, MIN_TOUCH, useColors } from '@/theme/tokens';

// A scrolling wheel like the iOS date wheel, built from a plain ScrollView so it behaves the same on phones and in the web build.
// Three rows show; the one in the middle band is the choice. Scroll, or tap a row. Screen readers can adjust it up and down.
// No extra package. Row height follows the text size setting.
export function WheelPicker({ label, items, value, onChange, flex = 1 }: { label: string; items: readonly WheelItem[]; value: number; onChange: (v: number) => void; flex?: number }) {
  const color = useColors();
  const h = rowHeight(font.label, MIN_TOUCH);
  const ref = useRef<ScrollViewInstance>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const index = indexOfValue(items, value);
  const lastIndex = useRef(index);

  // Put the wheel on the current value at the start, and again when the value changes from outside (for example the day is pulled back when the month is shorter).
  useEffect(() => {
    lastIndex.current = index;
    const id = setTimeout(() => ref.current?.scrollTo({ y: offsetForIndex(index, h), animated: false }), 0);
    return () => clearTimeout(id);
  }, [index, h, items.length]);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const settle = (y: number) => {
    const i = indexFromOffset(y, h, items.length);
    if (i !== lastIndex.current) { lastIndex.current = i; onChange(items[i].value); }
  };
  // The wheel has stopped when no scroll event arrives for a moment. This works the same on every platform.
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => settle(y), 140);
  };
  const go = (delta: number) => {
    const i = Math.min(items.length - 1, Math.max(0, index + delta));
    ref.current?.scrollTo({ y: offsetForIndex(i, h), animated: true });
    lastIndex.current = i; onChange(items[i].value);
  };
  const webKeys = Platform.OS === 'web'
    ? ({ tabIndex: 0, onKeyDown: (e: { key: string; preventDefault: () => void }) => { if (e.key === 'ArrowUp') { e.preventDefault(); go(-1); } else if (e.key === 'ArrowDown') { e.preventDefault(); go(1); } } } as object)
    : {};

  return (
    <View style={{ flex, minWidth: 0 }}>
      <Text numberOfLines={1} style={{ fontSize: font.body, color: color.muted, textAlign: 'center' }}>{label}</Text>
      <View
        accessible accessibilityRole="adjustable" accessibilityLabel={label} accessibilityValue={{ text: items[index]?.label ?? '' }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) => { if (e.nativeEvent.actionName === 'increment') go(1); else if (e.nativeEvent.actionName === 'decrement') go(-1); }}
        style={{ height: h * 3, overflow: 'hidden' }} {...webKeys}>
        <ScrollView ref={ref} showsVerticalScrollIndicator={false} snapToInterval={h} decelerationRate="fast" scrollEventThrottle={16} onScroll={onScroll} nestedScrollEnabled
          contentContainerStyle={{ paddingVertical: h }}>
          {items.map((it, i) => (
            <Pressable key={it.value} accessible={false} importantForAccessibility="no" onPress={() => go(i - index)} style={{ height: h, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }}>
              <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6} style={{ fontSize: font.label, fontWeight: i === index ? '800' : '500', color: i === index ? color.text : color.muted }}>{it.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
        {/* The middle band that marks the choice. Touches pass through to the rows. */}
        <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: h, height: h, borderTopWidth: 2, borderBottomWidth: 2, borderColor: color.primary, borderRadius: 8 }} />
      </View>
    </View>
  );
}
