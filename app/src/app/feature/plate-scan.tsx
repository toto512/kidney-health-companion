import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Image, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { FoodIcon } from '@/components/FoodIcon';
import { PlateFlagCard } from '@/components/PlateFlagCard';
import { UploadButtons, type Shot } from '@/components/UploadButtons';
import { BigButton, Body, DisclaimerFooter, Field, H1, Panel, Screen } from '@/components/ui';
import { FOOD_GROUPS, FOODS, type FoodGroup } from '@/content/foods';
import { useI18n } from '@/i18n/I18nProvider';
import type { Key } from '@/i18n/strings/en';
import { searchFoodNames } from '@/lib/foodSearch';
import { MAX_BYTES } from '@/lib/labData';
import { plateCheck, worstFlag } from '@/lib/plateCheck';
import { addEntry, foodById, groupEntries, MAX_SCAN_ITEMS, PORTIONS, plateTotals, portionAmounts, removeEntry, setPortion, type PortionKey, type ScanEntry } from '@/lib/plateScan';
import type { Country } from '@/lib/profile';
import { supabase } from '@/lib/supabase';
import { loadMyConditionIds } from '@/lib/userConditions';
import { font, useColors } from '@/theme/tokens';

const TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const bold = (c: string) => ({ fontSize: font.label, fontWeight: '800' as const, color: c });

// Scan my plate. The camera photo is only shown on this screen (kept in memory, never uploaded) and is never read by the app: no cloud vision, no AI.
// The person picks each food from the sourced food list and a portion. Amounts are the official table's own values scaled to the portion, each with its
// record and check date. A value the table marks "needs review" is hidden and left out of the plate total. Flags reuse the sourced condition lists only.
export default function PlateScanScreen() {
  const { t, lang } = useI18n();
  const color = useColors();
  const [photo, setPhoto] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [items, setItems] = useState<ScanEntry[]>([]);
  const [q, setQ] = useState('');
  const [section, setSection] = useState<FoodGroup | null>(null);
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
  const inSection = useMemo(() => (section ? FOODS.filter((f) => f.group === section).sort((a, b) => a.name.localeCompare(b.name)) : []), [section]);
  const flags = useMemo(() => {
    if (!results || !conds || conds.length === 0 || !country) return [];
    return plateCheck(items.map((i) => foodById(i.id)?.name ?? i.id), conds, country as Country);
  }, [results, items, conds, country]);
  const totals = useMemo(() => (results && country !== undefined ? plateTotals(items, country, lang) : []), [results, items, country, lang]);
  const back = () => (router.canGoBack() ? router.back() : router.replace('/feature/food'));

  function take(a: Shot | undefined) {
    if (!a) return;
    if (a.mimeType && !TYPES.includes(a.mimeType)) { setErr(t('plate.errType')); return; }
    if (a.fileSize && a.fileSize > MAX_BYTES) { setErr(t('plate.errSize')); return; }
    setErr(''); setPhoto(a.uri); setItems([]); setQ(''); setSection(null); setResults(false);
  }
  async function pickFile() {
    const res = await DocumentPicker.getDocumentAsync({ type: TYPES, copyToCacheDirectory: true, multiple: false });
    if (!res.canceled) take(res.assets[0]);
  }
  const unit = (n: string) => t(n === 'proteinG' ? 'food.unit.g' : 'food.unit.mg');
  const portionName = (p: PortionKey) => t(`plate.scan.p.${p}` as Key);

  if (!photo) {
    return (
      <ScrollView>
        <Screen>
          <H1>{t('plate.scan.title')}</H1>
          <Body>{t('plate.scan.intro')}</Body>
          <UploadButtons onFile={() => void pickFile()} onAsset={take} />
          {err ? <Body tone="danger">{err}</Body> : null}
          <BigButton variant="secondary" label={t('food.backGroups')} onPress={back} />
          <DisclaimerFooter />
        </Screen>
      </ScrollView>
    );
  }

  const photoView = <Image accessibilityLabel={t('plate.photoAlt')} source={{ uri: photo }} resizeMode="contain" style={{ width: '100%', height: 240, borderRadius: 8, backgroundColor: color.surface }} />;
  const groups = groupEntries(items);

  if (results) {
    return (
      <ScrollView>
        <Screen>
          <H1>{t('plate.scan.resultsTitle')}</H1>
          {photoView}
          <Body>{t('plate.scan.approx')}</Body>
          {groups.map(({ group, entries }) => (
            <View key={group} style={{ gap: 10 }}>
              <Text accessibilityRole="header" style={bold(color.text)}>{t('plate.scan.foodsIn', { group: t(`foodgrp.${group}` as Key), n: String(entries.length) })}</Text>
              {entries.map((e) => {
                const food = foodById(e.id)!;
                const pa = portionAmounts(e, country, lang);
                return (
                  <Panel key={e.id}>
                    <Text style={bold(color.text)}>{food.name}</Text>
                    {pa ? (
                      <>
                        <Body>{t('plate.scan.serving', { portion: portionName(e.portion), grams: String(Math.round(pa.grams)), serving: pa.amounts.serving })}</Body>
                        {pa.rows.map((r) => (
                          <Text key={r.nutrient} style={{ fontSize: font.body, color: color.text, minHeight: 36 }}>
                            <Text style={{ fontWeight: '700' }}>{`${t(`food.n.${r.nutrient}` as Key)} `}</Text>
                            {r.value === null ? t('food.notAvail') : `${r.value} ${unit(r.nutrient)}`}
                          </Text>
                        ))}
                        <Pressable accessibilityRole="link" onPress={() => Linking.openURL(pa.amounts.url)} style={{ minHeight: 56, paddingVertical: 8, justifyContent: 'center' }}>
                          <Text style={{ fontSize: font.body, color: color.primary, textDecorationLine: 'underline' }}>
                            {pa.amounts.source === 'cnf'
                              ? t('food.srcCnf', { name: pa.amounts.recordName, id: String(pa.amounts.recordId), date: pa.amounts.checkedOn })
                              : t('food.srcUsda', { file: pa.amounts.file ?? '', name: pa.amounts.recordName, id: String(pa.amounts.recordId), date: pa.amounts.checkedOn })}
                          </Text>
                        </Pressable>
                      </>
                    ) : <Body>{t('plate.scan.noNumbers')}</Body>}
                  </Panel>
                );
              })}
            </View>
          ))}
          <Panel>
            <Text accessibilityRole="header" style={bold(color.text)}>{t('plate.scan.totalTitle')}</Text>
            {totals.length === 0 ? <Body>{t('plate.scan.noTotals')}</Body> : (
              <>
                {totals.map((x) => (
                  <Text key={x.nutrient} style={{ fontSize: font.body, color: color.text, minHeight: 36 }}>
                    <Text style={{ fontWeight: '700' }}>{`${t(`food.n.${x.nutrient}` as Key)} `}</Text>{`${x.value} ${unit(x.nutrient)}`}
                    <Text style={{ color: color.muted }}>{`  ${t('plate.scan.totalNote', { counted: String(x.counted), of: String(x.of) })}`}</Text>
                  </Text>
                ))}
                <Body>{t('food.perServing')}</Body>
              </>
            )}
          </Panel>
          <Text accessibilityRole="header" style={bold(color.text)}>{t('plate.scan.official')}</Text>
          {conds === undefined || country === undefined ? null : !conds || conds.length === 0 ? <Panel><Body>{t('plate.noConds')}</Body></Panel> : !country ? <Panel><Body>{t('plate.noCountry')}</Body></Panel> : (
            <>
              <Panel><Text accessibilityRole="header" style={bold(color.text)}>{t(`plate.worst.${worstFlag(flags)}` as Key)}</Text></Panel>
              {flags.map((r) => <PlateFlagCard key={r.name} row={r} />)}
            </>
          )}
          <Body>{t('tiles.askDoctor')}</Body>
          <BigButton label={t('plate.scan.back')} onPress={() => setResults(false)} />
          <BigButton variant="secondary" label={t('plate.newPhoto')} onPress={() => { setPhoto(null); setResults(false); }} />
          <BigButton variant="secondary" label={t('food.backGroups')} onPress={back} />
          <DisclaimerFooter />
        </Screen>
      </ScrollView>
    );
  }

  const pickRow = (f: { id: string; name: string; sub: string; group: FoodGroup }) => (
    <Pressable key={f.id} accessibilityRole="button" accessibilityLabel={t('plate.scan.pickA11y', { name: f.name })} disabled={items.length >= MAX_SCAN_ITEMS || items.some((i) => i.id === f.id)}
      onPress={() => { setItems(addEntry(items, f.id)); setQ(''); }}
      style={{ minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 14, borderWidth: 2, borderColor: color.border, backgroundColor: color.surface, opacity: items.some((i) => i.id === f.id) ? 0.5 : 1 }}>
      <FoodIcon food={f} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: font.label, fontWeight: '700', color: color.text }}>{f.name}</Text>
        <Text style={{ fontSize: font.body * 0.85, color: color.muted }}>{f.sub}</Text>
      </View>
    </Pressable>
  );

  return (
    <ScrollView keyboardShouldPersistTaps="handled">
      <Screen>
        <H1>{t('plate.scan.title')}</H1>
        {photoView}
        <Body>{t('plate.scan.step')}</Body>
        <Field label={t('plate.search')} value={q} onChangeText={(v) => { setQ(v); if (v) setSection(null); }} autoCorrect={false} autoCapitalize="none" returnKeyType="search" />
        {q.trim() && found.length === 0 ? <Body>{t('plate.noMatch')}</Body> : null}
        {found.map(pickRow)}
        {!q.trim() ? (
          section ? (
            <>
              <Text accessibilityRole="header" style={bold(color.text)}>{t(`foodgrp.${section}` as Key)}</Text>
              <BigButton variant="secondary" label={t('plate.scan.backSections')} onPress={() => setSection(null)} />
              <View style={{ maxHeight: 360, borderRadius: 14, overflow: 'hidden' }}>
                <ScrollView nestedScrollEnabled contentContainerStyle={{ gap: 8 }}>
                  {inSection.length === 0 ? <Body>{t('plate.scan.noDataGroup')}</Body> : inSection.map(pickRow)}
                </ScrollView>
              </View>
            </>
          ) : (
            <>
              <Text accessibilityRole="header" style={bold(color.text)}>{t('plate.scan.sections')}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {FOOD_GROUPS.map((g) => (
                  <Pressable key={g} accessibilityRole="button" onPress={() => setSection(g)}
                    style={{ flexGrow: 1, flexBasis: 150, minHeight: 64, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 14, borderWidth: 2, borderColor: color.border, backgroundColor: color.surface, justifyContent: 'center' }}>
                    <Text style={{ fontSize: font.label, fontWeight: '700', color: color.text }}>{t(`foodgrp.${g}` as Key)}</Text>
                  </Pressable>
                ))}
              </View>
            </>
          )
        ) : null}
        {items.length >= MAX_SCAN_ITEMS ? <Body>{t('plate.limit', { n: String(MAX_SCAN_ITEMS) })}</Body> : null}
        <Text accessibilityRole="header" style={bold(color.text)}>{t('plate.onPlate', { n: String(items.length) })}</Text>
        {items.length === 0 ? <Body>{t('plate.none')}</Body> : groups.map(({ group, entries }) => (
          <View key={group} style={{ gap: 10 }}>
            <Text style={{ fontSize: font.body, fontWeight: '700', color: color.muted }}>{t(`foodgrp.${group}` as Key)}</Text>
            {entries.map((e) => {
              const name = foodById(e.id)!.name;
              return (
                <View key={e.id} style={{ gap: 8, padding: 12, borderRadius: 14, borderWidth: 2, borderColor: color.primary, backgroundColor: color.surface }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Text style={{ flex: 1, fontSize: font.label, fontWeight: '700', color: color.text }}>{name}</Text>
                    <Pressable accessibilityRole="button" accessibilityLabel={t('plate.remove', { name })} onPress={() => setItems(removeEntry(items, e.id))}
                      style={{ minHeight: 56, minWidth: 56, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={bold(color.primary)}>✕</Text>
                    </Pressable>
                  </View>
                  <Text style={{ fontSize: font.body, color: color.muted }}>{t('plate.scan.portion')}</Text>
                  <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {PORTIONS.map((p) => {
                      const on = e.portion === p.key;
                      return (
                        <Pressable key={p.key} accessibilityRole="radio" accessibilityState={{ selected: on, checked: on }} accessibilityLabel={`${name}, ${portionName(p.key)}`} onPress={() => setItems(setPortion(items, e.id, p.key))}
                          style={{ flexGrow: 1, flexBasis: 96, minHeight: 64, paddingVertical: 8, paddingHorizontal: 8, borderRadius: 14, borderWidth: 2, borderColor: color.primary, backgroundColor: on ? color.primary : color.surface, alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ fontSize: font.label, fontWeight: '800', color: on ? color.primaryText : color.primary, textAlign: 'center' }}>{portionName(p.key)}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              );
            })}
          </View>
        ))}
        <Body>{t('plate.scan.approx')}</Body>
        <BigButton label={t('plate.scan.show')} disabled={items.length === 0} onPress={() => setResults(true)} />
        <BigButton variant="secondary" label={t('plate.newPhoto')} onPress={() => setPhoto(null)} />
        <BigButton variant="secondary" label={t('food.backGroups')} onPress={back} />
        <DisclaimerFooter />
      </Screen>
    </ScrollView>
  );
}
