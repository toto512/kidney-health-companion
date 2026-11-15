import { ComponentRef, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Body, Field } from '@/components/ui';
import { color, font, MIN_TOUCH } from '@/theme/tokens';

const ROW = MIN_TOUCH;

// Typing stays the main way in. "Choose from a list" opens a scrollable list from the lowest to the highest
// number the app accepts, with jump buttons for fast scrolling. Nothing is pre-selected.
// The range is an input limit only. It says nothing about which numbers are healthy.
export function NumberField({ label, value, onChange, min, max, jumpStep }: {
  label: string; value: string; onChange: (v: string) => void; min: number; max: number; jumpStep: number;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<ComponentRef<typeof ScrollView>>(null);
  const picked = /^\d{1,3}$/.test(value.trim()) ? Number(value.trim()) : null;
  const jumps: number[] = [];
  for (let n = Math.ceil(min / jumpStep) * jumpStep; n <= max; n += jumpStep) jumps.push(n);

  const scrollTo = (n: number) => ref.current?.scrollTo({ y: (Math.min(Math.max(n, min), max) - min) * ROW, animated: false });
  // Typing a number moves the list to it, so typing works as a jump.
  useEffect(() => { if (open && picked !== null && picked >= min && picked <= max) scrollTo(picked); }, [open, picked]);

  const rows: number[] = [];
  for (let n = min; n <= max; n++) rows.push(n);

  return (
    <View style={{ gap: 8 }}>
      <Field label={label} value={value} onChangeText={onChange} keyboardType="number-pad" maxLength={3} />
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} accessibilityLabel={open ? `Close the list for ${label}` : `Choose ${label} from a list`}
        onPress={() => setOpen((o) => !o)} style={{ minHeight: MIN_TOUCH, justifyContent: 'center' }}>
        <Text style={{ color: color.primary, fontSize: font.label, fontWeight: '700', textDecorationLine: 'underline' }}>{open ? 'Close the list' : 'Choose from a list'}</Text>
      </Pressable>
      {open ? (
        <View style={{ gap: 8 }}>
          <Body>Scroll, then tap a number. The list shows every number the app accepts, from {min} to {max}. It does not show healthy numbers.</Body>
          <ScrollView horizontal showsHorizontalScrollIndicator accessibilityLabel="Jump to a number" contentContainerStyle={{ gap: 8 }}>
            {jumps.map((n) => (
              <Pressable key={n} accessibilityRole="button" accessibilityLabel={`Jump to ${n}`} onPress={() => scrollTo(n)}
                style={{ minWidth: MIN_TOUCH, minHeight: MIN_TOUCH, alignItems: 'center', justifyContent: 'center', borderRadius: 28, borderWidth: 2, borderColor: color.primary, paddingHorizontal: 12, backgroundColor: color.surface }}>
                <Text style={{ fontSize: font.label, fontWeight: '700', color: color.primary }}>{n}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <View style={{ borderWidth: 2, borderColor: color.border, borderRadius: 16, backgroundColor: color.surface, overflow: 'hidden' }}>
            <ScrollView ref={ref} nestedScrollEnabled style={{ height: ROW * 5 }} accessibilityLabel={`${label} numbers`}>
              {rows.map((n) => (
                <Pressable key={n} accessibilityRole="button" accessibilityLabel={String(n)} accessibilityState={{ selected: n === picked }}
                  onPress={() => { onChange(String(n)); setOpen(false); }}
                  style={{ height: ROW, justifyContent: 'center', paddingHorizontal: 16, borderTopWidth: n === min ? 0 : 1, borderColor: color.border, backgroundColor: n === picked ? color.primaryTint : color.surface }}>
                  <Text style={{ fontSize: font.h2, fontWeight: n === picked ? '700' : '400', color: color.text }}>{n}{n === picked ? '  ✓' : ''}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      ) : null}
    </View>
  );
}
