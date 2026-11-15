import { Link, Href } from 'expo-router';
import { ReactNode, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { font, MIN_TOUCH, Palette, space, useColors } from '@/theme/tokens';
import { DISCLAIMER } from '@/lib/disclaimer';

export function Screen({ children }: { children: ReactNode }) {
  const s = useStyles(); const color = useColors();
  return <View style={s.screen}>{children}</View>;
}

export function H1({ children }: { children: ReactNode }) {
  const s = useStyles(); const color = useColors();
  return <Text accessibilityRole="header" style={s.h1}>{children}</Text>;
}

export function Body({ children, tone }: { children: ReactNode; tone?: 'danger' }) {
  const s = useStyles(); const color = useColors();
  return <Text style={[s.body, tone === 'danger' && { color: color.danger }]}>{children}</Text>;
}

export function BigButton({ label, onPress, disabled, variant }: { label: string; onPress: () => void; disabled?: boolean; variant?: 'secondary' }) {
  const s = useStyles(); const color = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={[s.btn, variant === 'secondary' && s.btnSecondary, disabled && { opacity: 0.5 }]}
    >
      <Text style={[s.btnText, variant === 'secondary' && { color: color.primary }]}>{label}</Text>
    </Pressable>
  );
}

// A rounded block that groups related content (one condition, one reading, one section of a form).
export function Panel({ children, tone }: { children: ReactNode; tone?: 'danger' }) {
  const s = useStyles(); const color = useColors();
  return <View style={[s.panel, tone === 'danger' && { borderColor: color.danger, borderWidth: 2 }]}>{children}</View>;
}

export function H2({ children }: { children: ReactNode }) {
  const s = useStyles();
  return <Text accessibilityRole="header" style={s.h2}>{children}</Text>;
}

export function Field(props: TextInputProps & { label: string }) {
  const s = useStyles(); const color = useColors();
  const { label, ...rest } = props;
  const [focus, setFocus] = useState(false);
  return (
    <View style={{ gap: space.s }}>
      <Text style={s.label}>{label}</Text>
      <TextInput accessibilityLabel={label} style={[s.input, focus && s.inputFocus]} placeholderTextColor={color.muted} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)} {...rest} />
    </View>
  );
}

export function Tile({ label, icon, onPress }: { label: string; icon: string; bg?: string; onPress: () => void }) {
  const s = useStyles(); const color = useColors();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={s.tile}>
      <Text style={s.tileIcon} accessible={false}>{icon}</Text>
      <Text style={s.tileLabel}>{label}</Text>
    </Pressable>
  );
}

export function Card({ title, icon, onPress, tone, children }: { title: string; icon: string; onPress: () => void; tone?: 'danger'; children?: ReactNode }) {
  const s = useStyles(); const color = useColors();
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
  const s = useStyles(); const color = useColors();
  return <Text style={s.cardValue}>{children}</Text>;
}

export function CardNote({ children }: { children: ReactNode }) {
  const s = useStyles(); const color = useColors();
  return <Text style={s.cardNote}>{children}</Text>;
}

// Own mark: a rounded square with a cross drawn from two bars. Not taken from any other app.
export function Brand() {
  const s = useStyles(); const color = useColors();
  return (
    <View style={s.brand} accessible={false}>
      <View style={s.mark}>
        <View style={{ position: 'absolute', width: 26, height: 8, borderRadius: 4, backgroundColor: color.primaryText }} />
        <View style={{ position: 'absolute', width: 8, height: 26, borderRadius: 4, backgroundColor: color.primaryText }} />
      </View>
      <Text style={s.brandName}>Health Companion</Text>
    </View>
  );
}

// Shared layout for sign-in, create account, reset password and the authenticator code screens.
export function AuthScreen({ title, children, disclaimer }: { title: string; children: ReactNode; disclaimer?: boolean }) {
  const s = useStyles(); const color = useColors();
  return (
    <ScrollView style={{ backgroundColor: color.bg }} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} keyboardShouldPersistTaps="handled">
      <View style={s.authWrap}>
        <Brand />
        <View style={s.authCard}>
          <H1>{title}</H1>
          {children}
        </View>
        {disclaimer ? <DisclaimerFooter /> : null}
      </View>
    </ScrollView>
  );
}

export function TextLink({ href, label }: { href: Href; label: string }) {
  const s = useStyles(); const color = useColors();
  return (
    <Link href={href} asChild>
      <Pressable accessibilityRole="link" accessibilityLabel={label} style={s.textLink}>
        <Text style={s.textLinkText}>{label}</Text>
      </Pressable>
    </Link>
  );
}

export function DisclaimerFooter() {
  const s = useStyles(); const color = useColors();
  return <Text style={s.footer}>{DISCLAIMER}</Text>;
}

function useStyles() {
  const c = useColors();
  return useMemo(() => makeStyles(c), [c]);
}

const makeStyles = (color: Palette) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg, padding: space.l, gap: space.m, width: '100%', maxWidth: 640, alignSelf: 'center' },
  h1: { fontSize: font.h1, fontWeight: '700', color: color.text },
  body: { fontSize: font.body, color: color.text, lineHeight: font.body * 1.4 },
  label: { fontSize: font.label, fontWeight: '600', color: color.text },
  input: { fontSize: font.label, minHeight: MIN_TOUCH, borderWidth: 2, borderColor: color.inputBorder, backgroundColor: color.surface, borderRadius: 14, paddingHorizontal: space.m, color: color.text },
  inputFocus: { borderColor: color.primary, borderWidth: 3 },
  btn: { minHeight: MIN_TOUCH, backgroundColor: color.primary, borderRadius: 28, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.l },
  btnSecondary: { backgroundColor: color.surface, borderWidth: 2, borderColor: color.primary },
  btnText: { color: color.primaryText, fontSize: font.label, fontWeight: '700' },
  tile: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: space.m, paddingHorizontal: space.m, borderRadius: 20, borderWidth: 1, borderColor: color.outline, backgroundColor: color.surface },
  tileIcon: { fontSize: 28 },
  tileLabel: { color: color.text, fontSize: font.label, fontWeight: '600' },
  card: { borderRadius: 20, shadowColor: color.shadow, shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2, borderWidth: 1, borderColor: color.outline, backgroundColor: color.surface, padding: space.m, gap: space.s, minHeight: 96 },
  panel: { borderRadius: 20, borderWidth: 1, borderColor: color.border, backgroundColor: color.surface, padding: space.m, gap: space.m },
  h2: { fontSize: font.h2, fontWeight: '700', color: color.text },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: space.s },
  cardIcon: { fontSize: 24 },
  cardTitle: { flex: 1, color: color.text, fontSize: font.label, fontWeight: '700' },
  chev: { fontSize: 28, color: color.muted },
  cardValue: { color: color.text, fontSize: 34, fontWeight: '700' },
  cardNote: { color: color.muted, fontSize: font.body, lineHeight: font.body * 1.4 },
  brand: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  mark: { width: 48, height: 48, borderRadius: 14, backgroundColor: color.primary, alignItems: 'center', justifyContent: 'center' },
  brandName: { fontSize: font.h2, fontWeight: '700', color: color.primary },
  authWrap: { width: '100%', maxWidth: 520, alignSelf: 'center', padding: space.l, gap: space.l },
  authCard: { backgroundColor: color.surface, borderRadius: 24, padding: space.l, gap: space.m, borderWidth: 1, borderColor: color.border, shadowColor: color.shadow, shadowOpacity: 0.1, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 3 },
  textLink: { minHeight: MIN_TOUCH, alignItems: 'center', justifyContent: 'center' },
  textLinkText: { color: color.primary, fontSize: font.label, fontWeight: '700', textDecorationLine: 'underline' },
  footer: { fontSize: font.body, color: color.text, textAlign: 'center', paddingTop: space.m },
});
