import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { color, font, MIN_TOUCH } from '@/theme/tokens';

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Dropdown that opens directly under its field, with a search box and a scrollable list.
// Built from core components so it behaves the same on web, iOS and Android.
export function Select<T extends string>({ label, value, options, onChange, placeholder = 'Choose', searchLabel = 'Type to search', searchable = true }: {
  label: string; value: T | ''; options: { value: T; label: string }[]; onChange: (v: T) => void; placeholder?: string; searchLabel?: string; searchable?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const current = options.find((o) => o.value === value)?.label;
  const shown = useMemo(() => { const f = fold(q.trim()); return f ? options.filter((o) => fold(o.label).includes(f)) : options; }, [q, options]);
  const close = () => { setOpen(false); setQ(''); };
  return (
    <View style={{ gap: 8 }}>
      <Text style={{ fontSize: font.label, fontWeight: '600', color: color.text }}>{label}</Text>
      <Pressable accessibilityRole="combobox" accessibilityLabel={`${label}: ${current ?? placeholder}`} accessibilityState={{ expanded: open }} onPress={() => (open ? close() : setOpen(true))}
        style={{ minHeight: MIN_TOUCH, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, borderWidth: 2, borderColor: color.text, borderRadius: 12 }}>
        <Text style={{ fontSize: font.label, color: current ? color.text : '#6B7280' }}>{current ?? placeholder}</Text>
        <Text accessible={false} style={{ fontSize: font.label, color: color.text }}>{open ? '▴' : '▾'}</Text>
      </Pressable>
      {open ? (
        <View style={{ borderWidth: 2, borderColor: color.text, borderRadius: 12, backgroundColor: '#FFFFFF', overflow: 'hidden' }}>
          {searchable ? <TextInput accessibilityLabel={searchLabel} placeholder={searchLabel} placeholderTextColor="#6B7280" value={q} onChangeText={setQ} autoFocus autoCorrect={false} autoCapitalize="none"
            style={{ fontSize: font.label, minHeight: MIN_TOUCH, paddingHorizontal: 16, color: color.text, borderBottomWidth: 1, borderColor: '#D1D5DB' }} /> : null}
          <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" style={{ maxHeight: 320 }}>
            {shown.length === 0 ? <Text style={{ fontSize: font.body, padding: 16, color: color.text }}>No match. Check the spelling.</Text> : null}
            {shown.map((o, i) => (
              <Pressable key={o.value} accessibilityRole="menuitem" accessibilityState={{ selected: o.value === value }} onPress={() => { onChange(o.value); close(); }}
                style={{ minHeight: MIN_TOUCH, justifyContent: 'center', paddingHorizontal: 16, borderTopWidth: i === 0 ? 0 : 1, borderColor: '#E5E7EB', backgroundColor: o.value === value ? '#E6F2EF' : '#FFFFFF' }}>
                <Text style={{ fontSize: font.label, fontWeight: o.value === value ? '700' : '400', color: color.text }}>{o.label}{o.value === value ? '  ✓' : ''}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}
