import { useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { useI18n } from '@/i18n/I18nProvider';
import type { Key } from '@/i18n/strings/en';
import { usdaUrl } from '@/lib/foodAmounts';
import { LookupHit, searchUsda, type LookupError } from '@/lib/foodLookup';
import { font, useColors } from '@/theme/tokens';
import { BigButton, Body, Field } from './ui';

const NUTRIENTS = ['sodiumMg', 'potassiumMg', 'phosphorusMg', 'proteinG'] as const;

// Search USDA FoodData Central for a food that has no numbers in the app. Every number shown is labelled with the USDA record, a link and the day it was looked up.
export function UsdaLookup({ initial }: { initial: string }) {
  const { t } = useI18n();
  const color = useColors();
  const [q, setQ] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [hits, setHits] = useState<LookupHit[] | null>(null);
  const [err, setErr] = useState<LookupError | null>(null);
  const [sel, setSel] = useState<LookupHit | null>(null);
  const [date, setDate] = useState('');

  const run = async () => {
    if (busy || q.trim().length < 2) return;
    setBusy(true); setErr(null); setSel(null);
    const r = await searchUsda(q.trim());
    setBusy(false);
    if (r.ok) { setHits(r.foods); setDate(new Date().toISOString().slice(0, 10)); } else { setHits(null); setErr(r.error); }
  };

  return (
    <View style={{ gap: 10 }}>
      <Text accessibilityRole="header" style={{ fontSize: font.label, fontWeight: '800', color: color.text }}>{t('food.find.title')}</Text>
      <Field label={t('food.find.label')} value={q} onChangeText={setQ} returnKeyType="search" onSubmitEditing={run} autoCapitalize="none" maxLength={80} />
      <BigButton label={busy ? t('food.find.searching') : t('food.find.button')} onPress={run} disabled={busy || q.trim().length < 2} />
      {err ? <Body>{t(`food.find.err.${err}` as Key)}</Body> : null}
      {hits && hits.length === 0 ? <Body>{t('food.find.none')}</Body> : null}
      {hits && hits.length > 0 && !sel ? (
        <>
          <Body>{t('food.find.pick')}</Body>
          {hits.map((h) => (
            <Pressable key={h.fdcId} accessibilityRole="button" onPress={() => setSel(h)}
              style={{ minHeight: 56, justifyContent: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: color.border }}>
              <Text style={{ fontSize: font.body, fontWeight: '600', color: color.text }}>{h.name}</Text>
              <Text style={{ fontSize: font.body * 0.85, color: color.muted }}>{`USDA ${h.dataType}`}</Text>
            </Pressable>
          ))}
        </>
      ) : null}
      {sel ? (
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: font.label, fontWeight: '800', color: color.text }}>{sel.name}</Text>
          <Body>{t('food.find.per100')}</Body>
          {NUTRIENTS.map((k) => (
            <Text key={k} style={{ fontSize: font.body, color: color.text, minHeight: 40 }}>
              <Text style={{ fontWeight: '700' }}>{`${t(`food.n.${k}` as Key)} `}</Text>
              {sel.per100[k] === undefined ? t('food.notAvail') : `${sel.per100[k]} ${t(k === 'proteinG' ? 'food.unit.g' : 'food.unit.mg')}`}
            </Text>
          ))}
          <Pressable accessibilityRole="link" onPress={() => Linking.openURL(usdaUrl(sel.fdcId))} style={{ minHeight: 56, paddingVertical: 8, justifyContent: 'center' }}>
            <Text style={{ fontSize: font.body, color: color.primary, textDecorationLine: 'underline' }}>{t('food.find.source', { type: sel.dataType, name: sel.name, id: String(sel.fdcId), date })}</Text>
          </Pressable>
          <Body>{t('food.find.check')}</Body>
          <BigButton variant="secondary" label={t('food.find.back')} onPress={() => setSel(null)} />
        </View>
      ) : null}
    </View>
  );
}
