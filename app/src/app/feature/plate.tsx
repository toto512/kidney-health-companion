import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { PlateFlagCard } from '@/components/PlateFlagCard';
import { UploadButtons, type Shot } from '@/components/UploadButtons';
import { BigButton, Body, DisclaimerFooter, Field, H1, Panel, Screen } from '@/components/ui';
import { FOODS } from '@/content/foods';
import { useI18n } from '@/i18n/I18nProvider';
import type { Key } from '@/i18n/strings/en';
import { MAX_BYTES } from '@/lib/labData';
import { addItem, MAX_PLATE_ITEMS, plateCheck, removeItem, worstFlag } from '@/lib/plateCheck';
import { searchFoodNames } from '@/lib/foodSearch';
import type { Country } from '@/lib/profile';
import { supabase } from '@/lib/supabase';
import { loadMyConditionIds } from '@/lib/userConditions';
import { font, useColors } from '@/theme/tokens';

const TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Photo of my plate. The photo is only shown on this screen (kept in memory, never uploaded). The person names each food, then sees only
// what the official pages we already store say about those foods for their own conditions and country. No weights, no "ok to eat" label.
export default function PlateScreen() {
  const { t } = useI18n();
  const color = useColors();
  const [photo, setPhoto] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [items, setItems] = useState<string[]>([]);
  const [q, setQ] = useState('');
  const [results, setResults] = useState(false);
  const [country, setCountry] = useState<string | null | undefined>(undefined);
  const [conds, setConds] = useState<string[] | null | undefined>(undefined);

  useEffect(() => {
    let alive = true;
    supabase.from('profiles').select('country_code').maybeSingle().then(({ data }) => { if (alive) setCountry(data?.country_code ?? null); }, () => { if (alive) setCountry(null); });
    void loadMyConditionIds().then((ids) => { if (alive) setConds(ids); });
    return () => { alive = false; };
  }, []);

  const found = useMemo(() => (q.trim() ? searchFoodNames(FOODS, q).slice(0, 8) : []), [q]);
  const rows = useMemo(() => (results && conds && conds.length > 0 && country ? plateCheck(items, conds, country as Country) : []), [results, items, conds, country]);
  const worst = worstFlag(rows);

  function take(a: Shot | undefined) {
    if (!a) return;
    if (a.mimeType && !TYPES.includes(a.mimeType)) { setErr(t('plate.errType')); return; }
    if (a.fileSize && a.fileSize > MAX_BYTES) { setErr(t('plate.errSize')); return; }
    setErr(''); setPhoto(a.uri); setItems([]); setQ(''); setResults(false);
  }
  async function pickFile() {
    const res = await DocumentPicker.getDocumentAsync({ type: TYPES, copyToCacheDirectory: true, multiple: false });
    if (!res.canceled) take(res.assets[0]);
  }
  const back = () => (router.canGoBack() ? router.back() : router.replace('/feature/food'));

  if (!photo) {
    return (
      <ScrollView>
        <Screen>
          <H1>{t('plate.title')}</H1>
          <Body>{t('plate.intro')}</Body>
          <UploadButtons onFile={() => void pickFile()} onAsset={take} />
          {err ? <Body tone="danger">{err}</Body> : null}
          <Body>{t('plate.noAmounts')}</Body>
          <BigButton variant="secondary" label={t('food.backGroups')} onPress={back} />
          <DisclaimerFooter />
        </Screen>
      </ScrollView>
    );
  }

  const photoView = <Image accessibilityLabel={t('plate.photoAlt')} source={{ uri: photo }} resizeMode="contain" style={{ width: '100%', height: 280, borderRadius: 8, backgroundColor: color.surface }} />;

  if (results) {
    return (
      <ScrollView>
        <Screen>
          <H1>{t('plate.resultsTitle')}</H1>
          {photoView}
          {conds === undefined || country === undefined ? null : !conds || conds.length === 0 ? <Panel><Body>{t('plate.noConds')}</Body></Panel> : !country ? <Panel><Body>{t('plate.noCountry')}</Body></Panel> : (
            <>
              <Panel><Text accessibilityRole="header" style={{ fontSize: font.label, fontWeight: '800', color: color.text }}>{t(`plate.worst.${worst}` as Key)}</Text></Panel>
              {rows.map((r) => (
                <PlateFlagCard key={r.name} row={r} />
              ))}
            </>
          )}
          <Body>{t('plate.noAmounts')}</Body>
          <Body>{t('tiles.askDoctor')}</Body>
          <BigButton label={t('plate.edit')} onPress={() => setResults(false)} />
          <BigButton variant="secondary" label={t('plate.newPhoto')} onPress={() => { setPhoto(null); setResults(false); }} />
          <BigButton variant="secondary" label={t('food.backGroups')} onPress={back} />
          <DisclaimerFooter />
        </Screen>
      </ScrollView>
    );
  }

  return (
    <ScrollView keyboardShouldPersistTaps="handled">
      <Screen>
        <H1>{t('plate.title')}</H1>
        <Text style={{ fontSize: font.label, fontWeight: '700', color: color.text }}>{t('plate.yourPhoto')}</Text>
        {photoView}
        <Body>{t('plate.step')}</Body>
        <Field label={t('plate.search')} value={q} onChangeText={setQ} autoCorrect={false} autoCapitalize="none" returnKeyType="search" />
        {q.trim() && found.length === 0 ? <Body>{t('plate.noMatch')}</Body> : null}
        {found.map((f) => (
          <Pressable key={f.id} accessibilityRole="button" accessibilityLabel={t('plate.add', { name: f.name })} disabled={items.length >= MAX_PLATE_ITEMS}
            onPress={() => { setItems(addItem(items, f.name)); setQ(''); }}
            style={{ minHeight: 64, justifyContent: 'center', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 14, borderWidth: 2, borderColor: color.border, backgroundColor: color.surface }}>
            <Text style={{ fontSize: font.label, fontWeight: '700', color: color.text }}>{f.name}</Text>
            <Text style={{ fontSize: font.body * 0.85, color: color.muted }}>{f.sub}</Text>
          </Pressable>
        ))}
        {items.length >= MAX_PLATE_ITEMS ? <Body>{t('plate.limit', { n: String(MAX_PLATE_ITEMS) })}</Body> : null}
        <Text accessibilityRole="header" style={{ fontSize: font.label, fontWeight: '800', color: color.text }}>{t('plate.onPlate', { n: String(items.length) })}</Text>
        {items.length === 0 ? <Body>{t('plate.none')}</Body> : items.map((name) => (
          <View key={name} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 64, paddingHorizontal: 14, borderRadius: 14, borderWidth: 2, borderColor: color.primary, backgroundColor: color.surface }}>
            <Text style={{ flex: 1, fontSize: font.label, fontWeight: '700', color: color.text }}>{name}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel={t('plate.remove', { name })} onPress={() => setItems(removeItem(items, name))}
              style={{ minHeight: 56, minWidth: 56, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: font.label, fontWeight: '800', color: color.primary }}>✕</Text>
            </Pressable>
          </View>
        ))}
        <BigButton label={t('plate.show')} disabled={items.length === 0} onPress={() => setResults(true)} />
        <BigButton variant="secondary" label={t('plate.newPhoto')} onPress={() => setPhoto(null)} />
        <BigButton variant="secondary" label={t('food.backGroups')} onPress={back} />
        <DisclaimerFooter />
      </Screen>
    </ScrollView>
  );
}
