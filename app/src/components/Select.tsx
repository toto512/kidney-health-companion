import { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { color, font, MIN_TOUCH } from '@/theme/tokens';

// Dropdown built from core components so it behaves the same on web, iOS and Android, with 56px rows and no extra native module.
export function Select<T extends string>({ label, value, options, onChange, placeholder = 'Choose' }: {
  label: string; value: T | ''; options: { value: T; label: string }[]; onChange: (v: T) => void; placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value)?.label;
  return (
    <View style={{ gap: 8 }}>
      <Text style={{ fontSize: font.label, fontWeight: '600', color: color.text }}>{label}</Text>
      <Pressable accessibilityRole="combobox" accessibilityLabel={`${label}: ${current ?? placeholder}`} accessibilityState={{ expanded: open }} onPress={() => setOpen(true)}
        style={{ minHeight: MIN_TOUCH, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, borderWidth: 2, borderColor: color.text, borderRadius: 12 }}>
        <Text style={{ fontSize: font.label, color: current ? color.text : '#6B7280' }}>{current ?? placeholder}</Text>
        <Text accessible={false} style={{ fontSize: font.label, color: color.text }}>{'▾'}</Text>
      </Pressable>
      <Modal transparent animationType="fade" visible={open} onRequestClose={() => setOpen(false)}>
        <Pressable accessibilityLabel="Close list" onPress={() => setOpen(false)} style={{ flex: 1, backgroundColor: 'rgba(17,24,39,0.45)', justifyContent: 'center', padding: 24 }}>
          <View accessibilityRole="menu" style={{ backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden' }}>
            {options.map((o, i) => (
              <Pressable key={o.value} accessibilityRole="menuitem" accessibilityState={{ selected: o.value === value }} onPress={() => { onChange(o.value); setOpen(false); }}
                style={{ minHeight: MIN_TOUCH + 8, justifyContent: 'center', paddingHorizontal: 20, borderTopWidth: i === 0 ? 0 : 1, borderColor: '#E5E7EB', backgroundColor: o.value === value ? '#E6F2EF' : '#FFFFFF' }}>
                <Text style={{ fontSize: font.label, fontWeight: o.value === value ? '700' : '400', color: color.text }}>{o.label}{o.value === value ? '  ✓' : ''}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
