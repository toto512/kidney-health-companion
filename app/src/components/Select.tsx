import { useEffect, useId, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { font, MIN_TOUCH, useColors } from '@/theme/tokens';

// Only one dropdown is open at a time: opening one closes any other (accordion behaviour).
let openId: string | null = null;
const listeners = new Set<() => void>();
const setOpenId = (id: string | null) => { openId = id; listeners.forEach((l) => l()); };

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Dropdown that opens directly under its field, with a search box and a scrollable list.
// Built from core components so it behaves the same on web, iOS and Android.
export function Select<T extends string>({ label, value, options, onChange, placeholder = 'Choose', searchLabel = 'Type to search', searchable = true, width, valueSize = font.label }: {
  label: string; value: T | ''; options: { value: T; label: string }[]; onChange: (v: T) => void; placeholder?: string; searchLabel?: string; searchable?: boolean; width?: number; valueSize?: number;
}) {
  const color = useColors();
  const id = useId();
  const [open, setOpenState] = useState(false);
  useEffect(() => {
    const l = () => setOpenState(openId === id);
    listeners.add(l);
    return () => { listeners.delete(l); if (openId === id) openId = null; };
  }, [id]);
  const setOpen = (o: boolean) => setOpenId(o ? id : openId === id ? null : openId);
  const [q, setQ] = useState('');
  const current = options.find((o) => o.value === value)?.label;
  const shown = useMemo(() => { const f = fold(q.trim()); return f ? options.filter((o) => fold(o.label).includes(f)) : options; }, [q, options]);
  useEffect(() => { if (!open) setQ(''); }, [open]);
  const close = () => { setOpen(false); setQ(''); };
  return (
    <View style={{ gap: 8, width }}>
      <Text style={{ fontSize: font.label, fontWeight: '600', color: color.text }}>{label}</Text>
      <Pressable accessibilityRole="combobox" accessibilityLabel={`${label}: ${current ?? placeholder}`} accessibilityState={{ expanded: open }} onPress={() => (open ? close() : setOpen(true))}
        style={{ minHeight: MIN_TOUCH, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, borderWidth: 2, borderColor: color.text, borderRadius: 12 }}>
        <Text style={{ fontSize: valueSize, color: current ? color.text : color.muted }}>{current ?? placeholder}</Text>
        <Text accessible={false} style={{ fontSize: font.label, color: color.text }}>{open ? '▴' : '▾'}</Text>
      </Pressable>
      {open ? (
        <View style={{ borderWidth: 2, borderColor: color.text, borderRadius: 12, backgroundColor: color.surface, overflow: 'hidden' }}>
          {searchable ? <TextInput accessibilityLabel={searchLabel} placeholder={searchLabel} placeholderTextColor={color.muted} value={q} onChangeText={setQ} autoFocus autoCorrect={false} autoCapitalize="none"
            style={{ fontSize: font.label, minHeight: MIN_TOUCH, paddingVertical: 8, paddingHorizontal: 16, color: color.text, borderBottomWidth: 1, borderColor: color.border }} /> : null}
          <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" style={{ maxHeight: 320 }}>
            {shown.length === 0 ? <Text style={{ fontSize: font.body, padding: 16, color: color.text }}>No match. Check the spelling.</Text> : null}
            {shown.map((o, i) => (
              <Pressable key={o.value} accessibilityRole="menuitem" accessibilityState={{ selected: o.value === value }} onPress={() => { onChange(o.value); close(); }}
                style={{ minHeight: MIN_TOUCH, paddingVertical: 8, justifyContent: 'center', paddingHorizontal: 16, borderTopWidth: i === 0 ? 0 : 1, borderColor: color.border, backgroundColor: o.value === value ? color.primaryTint : color.surface }}>
                <Text style={{ fontSize: font.label, fontWeight: o.value === value ? '700' : '400', color: color.text }}>{o.label}{o.value === value ? '  ✓' : ''}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}
