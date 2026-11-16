import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Linking, Platform, Pressable, Text, View } from 'react-native';
import { useI18n } from '@/i18n/I18nProvider';
import { displayPhone, relationshipLabel, telHref } from '@/lib/contactLogic';
import type { Contact } from '@/lib/emergencyContacts';
import { font, useColors } from '@/theme/tokens';

// Press and hold this long to dial. A quick tap only shows a hint, so a bump or a shaky hand never starts a call.
export const HOLD_MS = 1500;

// Name, role and number on the left (tap opens the confirm screen). A large green Call button on the right (press and hold).
export function ContactRow({ c }: { c: Contact }) {
  const color = useColors();
  const { t } = useI18n();
  const fill = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const done = useRef(false);
  const [state, setState] = useState<'idle' | 'holding' | 'hint' | 'failed'>('idle');
  const href = telHref(c.phone);

  const clear = () => { if (timer.current) { clearTimeout(timer.current); timer.current = null; } };
  useEffect(() => clear, []);

  const start = () => {
    done.current = false;
    setState('holding');
    fill.setValue(0);
    Animated.timing(fill, { toValue: 1, duration: HOLD_MS, useNativeDriver: false }).start();
    clear();
    timer.current = setTimeout(() => {
      done.current = true;
      if (!href) { setState('failed'); return; }
      Linking.openURL(href).then(() => setState('idle')).catch(() => setState('failed'));
    }, HOLD_MS);
  };
  const stop = () => {
    clear();
    if (done.current) return;
    fill.stopAnimation();
    fill.setValue(0);
    setState('hint');
  };
  useEffect(() => {
    if (state !== 'hint') return;
    const h = setTimeout(() => setState('idle'), 3000);
    return () => clearTimeout(h);
  }, [state]);

  const confirmHref = { pathname: '/feature/call-contact', params: { id: c.id } } as const;
  const green = color.accent.green;
  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'stretch', gap: 12, borderRadius: 18, borderWidth: 2, borderColor: color.accent.teal, backgroundColor: color.surface, padding: 10 }}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('today.callPerson', { name: c.name, relationship: relationshipLabel(c.relationship), phone: displayPhone(c.phone) })}
          onPress={() => router.push(confirmHref)} style={{ flex: 1, minHeight: 72, justifyContent: 'center', paddingHorizontal: 8 }}>
          <Text style={{ fontSize: font.label, fontWeight: '800', color: color.text }}>{c.name}</Text>
          <Text style={{ fontSize: font.body, color: color.muted }}>{relationshipLabel(c.relationship)}</Text>
          <Text style={{ fontSize: font.body, fontWeight: '700', color: color.text }}>{displayPhone(c.phone)}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={`${t('contact.call')} ${c.name}`} accessibilityHint={t('contact.holdA11y')}
          onPressIn={start} onPressOut={stop} onAccessibilityTap={() => router.push(confirmHref)}
          style={{ width: 112, minHeight: 72, borderRadius: 16, overflow: 'hidden', backgroundColor: green, alignItems: 'center', justifyContent: 'center' }}>
          <Animated.View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: fill.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }), backgroundColor: color.primary, opacity: 0.55 }} />
          <Text style={{ fontSize: font.label, fontWeight: '800', color: color.primaryText }}>{state === 'holding' ? t('contact.keepHolding') : t('contact.call')}</Text>
        </Pressable>
      </View>
      {state === 'hint' ? <Text accessibilityLiveRegion="polite" style={{ fontSize: font.body, fontWeight: '700', color: color.text, marginTop: 6, textAlign: 'right' }}>{t('contact.holdHint')}</Text> : null}
      {state === 'failed' ? <Text accessibilityRole="alert" style={{ fontSize: font.body, fontWeight: '700', color: color.danger, marginTop: 6 }}>{t('contact.failed', { phone: displayPhone(c.phone) })}</Text> : null}
      {Platform.OS === 'web' && state === 'holding' ? <Text style={{ fontSize: font.body, color: color.muted, marginTop: 6 }}>{t('contact.webNote')}</Text> : null}
    </View>
  );
}
