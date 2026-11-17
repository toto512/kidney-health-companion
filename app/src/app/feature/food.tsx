import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { BigButton, Body, DisclaimerFooter, Field, H1, Panel, Screen } from '@/components/ui';
import { Food, FOODS, FOOD_CATEGORIES, FoodCategory } from '@/content/foods';
import { useI18n } from '@/i18n/I18nProvider';
import type { Key } from '@/i18n/strings/en';
import { searchFoods } from '@/lib/foodSearch';
import { font, useColors } from '@/theme/tokens';

// Step 1: find a food, see its typical serving. Amounts and ratings appear only with an official source (later steps).
export default function FoodScreen() {
  const color = useColors();
  const { t } = useI18n();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<FoodCategory | 'all'>('all');
  const [open, setOpen] = useState<Food | null>(null);
  const results = useMemo(() => searchFoods(FOODS, q, cat), [q, cat]);

  if (open) {
    const a = open.amounts;
    return (
      <ScrollView>
        <Screen>
          <H1>{open.name}</H1>
          <Panel>
            <Body>{t('food.serving', { serving: open.serving })}</Body>
            <Text accessibilityRole="header" style={{ fontSize: font.label, fontWeight: '800', color: color.text }}>{t('food.needsReview')}</Text>
            <Text style={{ fontSize: font.label, fontWeight: '700', color: color.text }}>{t('food.amounts')}</Text>
            {a ? (
              <>
                {a.sodiumMg !== undefined ? <Body>{`Sodium ${a.sodiumMg} mg`}</Body> : null}
                {a.potassiumMg !== undefined ? <Body>{`Potassium ${a.potassiumMg} mg`}</Body> : null}
                {a.phosphorusMg !== undefined ? <Body>{`Phosphorus ${a.phosphorusMg} mg`}</Body> : null}
                {a.proteinG !== undefined ? <Body>{`Protein ${a.proteinG} g`}</Body> : null}
                <Pressable accessibilityRole="link" onPress={() => Linking.openURL(a.url)} style={{ minHeight: 56, justifyContent: 'center' }}>
                  <Text style={{ fontSize: font.body, color: color.primary, textDecorationLine: 'underline' }}>{`${a.source}. ${a.checkedOn}`}</Text>
                </Pressable>
              </>
            ) : <Body>{t('food.notChecked')}</Body>}
          </Panel>
          <Body>{t('food.step')}</Body>
          <BigButton variant="secondary" label={t('food.back')} onPress={() => setOpen(null)} />
          <DisclaimerFooter />
        </Screen>
      </ScrollView>
    );
  }

  const chips: (FoodCategory | 'all')[] = ['all', ...FOOD_CATEGORIES];
  return (
    <ScrollView keyboardShouldPersistTaps="handled">
      <Screen>
        <H1>{t('food.title')}</H1>
        <Field label={t('food.search')} value={q} onChangeText={setQ} autoCorrect={false} autoCapitalize="none" returnKeyType="search" />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {chips.map((c) => {
            const on = c === cat;
            return (
              <Pressable key={c} accessibilityRole="button" accessibilityState={{ selected: on }} onPress={() => setCat(c)}
                style={{ minHeight: 48, paddingHorizontal: 16, justifyContent: 'center', borderRadius: 24, borderWidth: 2, borderColor: on ? color.primary : color.border, backgroundColor: color.surface }}>
                <Text style={{ fontSize: font.body, fontWeight: on ? '800' : '600', color: color.text }}>{c === 'all' ? t('food.all') : t(`foodcat.${c}` as Key)}</Text>
              </Pressable>
            );
          })}
        </View>
        {results.length === 0 ? <Panel><Body>{t('food.noMatch')}</Body></Panel> : null}
        {results.map((f) => (
          <Pressable key={f.id} accessibilityRole="button" accessibilityLabel={f.name} onPress={() => setOpen(f)}
            style={{ minHeight: 64, justifyContent: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: color.border }}>
            <Text style={{ fontSize: font.label, fontWeight: '700', color: color.text }}>{f.name}</Text>
            <Text style={{ fontSize: font.body, color: color.muted }}>{t(`foodcat.${f.category}` as Key)}</Text>
          </Pressable>
        ))}
        <BigButton variant="secondary" label={t('food.back')} onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
        <DisclaimerFooter />
      </Screen>
    </ScrollView>
  );
}
