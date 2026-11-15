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

export function Tile({ label, icon, onPress }: { label: string; icon: string; bg?: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={s.tile}>
      <Text style={s.tileIcon} accessible={false}>{icon}</Text>
      <Text style={s.tileLabel}>{label}</Text>
    </Pressable>
  );
}

export function Card({ title, icon, onPress, tone, children }: { title: string; icon: string; onPress: () => void; tone?: 'danger'; children?: ReactNode }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress} style={[s.card, tone === 'danger' && { borderColor: color.danger, borderWidth: 2 }]}>
      <View style={s.cardHead}>
        <Text style={s.cardIcon} accessible={false}>{icon}</Text>
        <Text style={[s.cardTitle, tone === 'danger' && { color: color.danger }]}>{title}</Text>
        <Text style={s.chev} accessible={false}>›</Text>
      </View>
      {children}
    </Pressable>
  );
}

export function CardValue({ children }: { children: ReactNode }) {
  return <Text style={s.cardValue}>{children}</Text>;
}

export function CardNote({ children }: { children: ReactNode }) {
  return <Text style={s.cardNote}>{children}</Text>;
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
  tile: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: space.m, paddingHorizontal: space.m, borderRadius: 12, borderWidth: 1, borderColor: '#D1D5DB', backgroundColor: '#F9FAFB' },
  tileIcon: { fontSize: 28 },
  tileLabel: { color: color.text, fontSize: font.label, fontWeight: '600' },
  card: { borderRadius: 16, borderWidth: 1, borderColor: '#D1D5DB', backgroundColor: '#F9FAFB', padding: space.m, gap: space.s, minHeight: 96 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: space.s },
  cardIcon: { fontSize: 24 },
  cardTitle: { flex: 1, color: color.text, fontSize: font.label, fontWeight: '700' },
  chev: { fontSize: 28, color: '#4B5563' },
  cardValue: { color: color.text, fontSize: 34, fontWeight: '700' },
  cardNote: { color: '#374151', fontSize: font.body, lineHeight: font.body * 1.4 },
  footer: { fontSize: font.body, color: color.text, textAlign: 'center', paddingTop: space.m },
});
