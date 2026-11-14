import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { color, font, MIN_TOUCH, space } from '@/theme/tokens';
import { DISCLAIMER } from '@/lib/disclaimer';

export function Screen({ children }: { children: ReactNode }) {
  return <View style={s.screen}>{children}</View>;
}

export function H1({ children }: { children: ReactNode }) {
  return <Text accessibilityRole="header" style={s.h1}>{children}</Text>;
}

export function Body({ children, tone }: { children: ReactNode; tone?: 'danger' }) {
  return <Text style={[s.body, tone === 'danger' && { color: color.danger }]}>{children}</Text>;
}

export function BigButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={[s.btn, disabled && { opacity: 0.5 }]}
    >
      <Text style={s.btnText}>{label}</Text>
    </Pressable>
  );
}

export function Field(props: TextInputProps & { label: string }) {
  const { label, ...rest } = props;
  return (
    <View style={{ gap: space.s }}>
      <Text style={s.label}>{label}</Text>
      <TextInput accessibilityLabel={label} style={s.input} placeholderTextColor="#6B7280" {...rest} />
    </View>
  );
}

export function Tile({ label, icon, bg, onPress }: { label: string; icon: string; bg: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={[s.tile, { backgroundColor: bg }]}>
      <Text style={s.tileIcon} accessible={false}>{icon}</Text>
      <Text style={s.tileLabel}>{label}</Text>
    </Pressable>
  );
}

export function DisclaimerFooter() {
  return <Text style={s.footer}>{DISCLAIMER}</Text>;
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg, padding: space.l, gap: space.m },
  h1: { fontSize: font.h1, fontWeight: '700', color: color.text },
  body: { fontSize: font.body, color: color.text, lineHeight: font.body * 1.4 },
  label: { fontSize: font.label, fontWeight: '600', color: color.text },
  input: { fontSize: font.label, minHeight: MIN_TOUCH, borderWidth: 2, borderColor: color.text, borderRadius: 12, paddingHorizontal: space.m, color: color.text },
  btn: { minHeight: MIN_TOUCH, backgroundColor: color.primary, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.l },
  btnText: { color: color.primaryText, fontSize: font.label, fontWeight: '700' },
  tile: { flexBasis: '47%', flexGrow: 1, minHeight: 140, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: space.s, padding: space.m },
  tileIcon: { fontSize: 48 },
  tileLabel: { color: '#FFFFFF', fontSize: font.label, fontWeight: '700', textAlign: 'center' },
  footer: { fontSize: font.body, color: color.text, textAlign: 'center', paddingTop: space.m },
});
