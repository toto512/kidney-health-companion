import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Image, Linking, Platform, Pressable, ScrollView, type ScrollViewInstance, Text, View } from 'react-native';
import { BigButton, Body, DisclaimerFooter, Field, H1, Panel, Screen } from '@/components/ui';
import { FoodIcon } from '@/components/FoodIcon';
import { TILE_IMAGE } from '@/content/foodTileImages';
import { UsdaLookup } from '@/components/UsdaLookup';
import { Food, FOODS, FOOD_GROUPS, FoodGroup } from '@/content/foods';
import { useI18n } from '@/i18n/I18nProvider';
import type { Key } from '@/i18n/strings/en';
import type { FormKind } from '@/content/foodNutrition';
import { amountsFor, lookupLinks, reviewReason } from '@/lib/foodAmounts';
import { searchFoodNames, searchFoods } from '@/lib/foodSearch';
import { foodCheck } from '@/lib/foodCheck';
import { loadMyConditionIds } from '@/lib/userConditions';
import type { Country } from '@/lib/profile';
import { supabase } from '@/lib/supabase';
import { font, useColors } from '@/theme/tokens';

type Step = { kind: 'groups' } | { kind: 'wheel'; group: FoodGroup } | { kind: 'detail'; group: FoodGroup; food: Food };

// Tiles, then a wheel of the group's foods, then the details. No amount or rating shows without an official source.
export default function FoodScreen() {
  const [step, setStep] = useState<Step>({ kind: 'groups' });
  const [selId, setSelId] = useState<string | null>(null);
  if (step.kind === 'groups') return <Groups onPick={(g) => { setSelId(null); setStep({ kind: 'wheel', group: g }); }} onOpen={(food) => { setSelId(food.id); setStep({ kind: 'detail', group: food.group, food }); }} />;
  if (step.kind === 'wheel') return <Wheel group={step.group} selId={selId} setSelId={setSelId} onBack={() => setStep({ kind: 'groups' })} onOpen={(food) => setStep({ kind: 'detail', group: step.group, food })} />;
  return <Detail key={step.food.id} group={step.group} food={step.food} onSwitch={(food) => { setSelId(food.id); setStep({ kind: 'detail', group: step.group, food }); }} onAnother={() => { setSelId(step.food.id); setStep({ kind: 'wheel', group: step.group }); }} onGroups={() => setStep({ kind: 'groups' })} />;
}

function Groups({ onPick, onOpen }: { onPick: (g: FoodGroup) => void; onOpen: (f: Food) => void }) {
  const color = useColors();
  const { t } = useI18n();
  const [q, setQ] = useState('');
  const searching = q.trim().length > 0;
  const found = useMemo(() => (searching ? searchFoodNames(FOODS, q) : []), [q, searching]);
  return (
    <ScrollView keyboardShouldPersistTaps="handled">
      <Screen>
        <H1>{t('food.title')}</H1>
        <Field label={t('food.searchAll')} placeholder={t('food.searchHint')} value={q} onChangeText={setQ} autoCorrect={false} autoCapitalize="none" returnKeyType="search" />
        {searching ? (
          <>
            <Text accessibilityRole="header" style={{ fontSize: font.label, fontWeight: '700', color: color.text }}>{t('food.choose', { n: String(found.length) })}</Text>
            {found.length === 0 ? <Panel><Body>{t('food.noneInGroup')}</Body></Panel> : found.slice(0, 40).map((f) => (
              <Pressable key={f.id} accessibilityRole="button" accessibilityLabel={`${f.name}, ${t(`foodgrp.${f.group}` as Key)}, ${f.sub}`} onPress={() => onOpen(f)}
                style={{ minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 14, borderWidth: 2, borderColor: color.border, backgroundColor: color.surface }}>
                <FoodIcon food={f} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontSize: font.label, fontWeight: '700', color: color.text }}>{f.name}</Text>
                  <Text style={{ fontSize: font.body * 0.85, color: color.muted }}>{`${t(`foodgrp.${f.group}` as Key)} › ${f.sub}`}</Text>
                </View>
              </Pressable>
            ))}
            {found.length > 40 ? <Body>{t('food.moreHint')}</Body> : null}
            <BigButton variant="secondary" label={t('food.clearSearch')} onPress={() => setQ('')} />
          </>
        ) : (
        <>
        <Text accessibilityRole="header" style={{ fontSize: font.label, fontWeight: '800', color: color.text }}>{t('food.groupsQ')}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {FOOD_GROUPS.map((g) => <GroupTile key={g} g={g} onPick={onPick} />)}
        </View>
        </>
        )}
        <BigButton variant="secondary" label={t('profile.backHealth')} onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
        <Text style={{ fontSize: font.body * 0.8, color: color.muted }}>{t('food.iconCredit')}</Text>
        <DisclaimerFooter />
      </Screen>
    </ScrollView>
  );
}

// Group tile: name on the start side with the picture on the other side when the tile is wide and text is Normal. On narrow tiles or at Large and Extra large text the picture goes above the name, so the name never breaks mid-word.
function GroupTile({ g, onPick }: { g: FoodGroup; onPick: (g: FoodGroup) => void }) {
  const color = useColors();
  const { t } = useI18n();
  const [w, setW] = useState(0);
  const side = w >= 250 && font.label <= 20;
  const pic = (
    <View accessible={false} importantForAccessibility="no-hide-descendants" aria-hidden
      style={{ width: 76, height: 72, borderRadius: 12, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
      <Image source={TILE_IMAGE[g]} accessible={false} style={{ width: 76, height: 72 }} resizeMode="contain" />
    </View>
  );
  const name = <Text style={{ fontSize: font.label, fontWeight: '800', color: color.text, flexShrink: 1 }}>{t(`foodgrp.${g}` as Key)}</Text>;
  return (
    <Pressable accessibilityRole="button" onPress={() => onPick(g)} onLayout={(e) => setW(e.nativeEvent.layout.width)}
      style={{ flexGrow: 1, flexBasis: '45%', minHeight: 84, justifyContent: 'space-between', flexDirection: side ? 'row' : 'column', alignItems: side ? 'center' : 'flex-start', gap: 10, padding: 12, borderRadius: 18, borderWidth: 2, borderColor: color.border, backgroundColor: color.surface }}>
      {side ? <>{name}{pic}</> : <>{pic}{name}</>}
    </Pressable>
  );
}

function Wheel({ group, selId, setSelId, onBack, onOpen }: { group: FoodGroup; selId: string | null; setSelId: (id: string | null) => void; onBack: () => void; onOpen: (f: Food) => void }) {
  const color = useColors();
  const { t } = useI18n();
  const [q, setQ] = useState('');
  const list = useMemo(() => searchFoods(FOODS, q, group), [q, group]);
  const selIndex = Math.max(0, list.findIndex((f) => f.id === selId));
  const sel = list[selIndex];
  const scroller = useRef<ScrollViewInstance>(null);
  const ys = useRef<Record<string, number>>({});
  // Keeps the chosen row in view with about two rows above it. The list starts flush at the top, no blank rows.
  const place = (id: string | undefined, animated: boolean) => { if (id !== undefined && ys.current[id] !== undefined) scroller.current?.scrollTo({ y: Math.max(0, ys.current[id] - 112), animated }); };
  useEffect(() => { const id = setTimeout(() => place(sel?.id, false), 0); return () => clearTimeout(id); }, [sel?.id, list.length]); // eslint-disable-line react-hooks/exhaustive-deps
  const move = (d: number) => { const n = list[Math.max(0, Math.min(list.length - 1, selIndex + d))]; if (n) setSelId(n.id); };
  const webKeys = Platform.OS === 'web' ? ({ tabIndex: 0, onKeyDown: (e: { key: string; preventDefault: () => void }) => {
    const k: Record<string, () => void> = { ArrowDown: () => move(1), ArrowUp: () => move(-1), PageDown: () => move(5), PageUp: () => move(-5), Home: () => move(-list.length), End: () => move(list.length), Enter: () => { if (sel) onOpen(sel); } };
    if (k[e.key]) { e.preventDefault(); k[e.key](); }
  } } as object) : {};
  return (
    <ScrollView keyboardShouldPersistTaps="handled">
      <Screen>
        {/* Title and a Back button on one row. A long title pushes the button under it. In right-to-left languages the row flips, so the button sits on the left. */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', columnGap: 12, rowGap: 8 }}>
          <View style={{ flexGrow: 1, flexShrink: 1, flexBasis: 220, minWidth: 0 }}>
            <H1>{t(`foodgrp.${group}` as Key)}</H1>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={t('food.backGroups')} onPress={onBack}
            style={{ minHeight: 56, paddingVertical: 8, minWidth: 96, paddingHorizontal: 18, borderRadius: 14, borderWidth: 2, borderColor: color.primary, backgroundColor: color.surface, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: font.label, fontWeight: '800', color: color.primary }}>{t('food.backShort')}</Text>
          </Pressable>
        </View>
        <Field label={t('food.searchGroup')} placeholder={t('food.searchHint')} value={q} onChangeText={(v) => { setQ(v); setSelId(null); }} autoCorrect={false} autoCapitalize="none" returnKeyType="search" />
        <Text accessibilityRole="header" style={{ fontSize: font.label, fontWeight: '700', color: color.text }}>{t('food.choose', { n: String(list.length) })}</Text>
        {list.length === 0 ? <Panel><Body>{t('food.noneInGroup')}</Body></Panel> : (
          <View accessibilityRole="list" accessibilityLabel={t('food.choose', { n: String(list.length) })} {...webKeys}
            style={{ height: 380, borderWidth: 2, borderColor: color.border, borderRadius: 16, backgroundColor: color.surface, overflow: 'hidden' }}>
            <ScrollView ref={scroller} nestedScrollEnabled>
              {list.map((f, i) => {
                const on = i === selIndex;
                return (
                  <Pressable key={f.id} accessibilityRole="button" accessibilityState={{ selected: on }} accessibilityLabel={`${f.name}, ${f.sub}`}
                    accessibilityHint={on ? t('food.show') : undefined}
                    onLayout={(e) => { ys.current[f.id] = e.nativeEvent.layout.y; }}
                    onPress={() => { if (on) onOpen(f); else setSelId(f.id); }}
                    style={{ minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6, paddingLeft: 14, paddingRight: 8, margin: 4, borderRadius: 12, borderWidth: on ? 2 : 0, borderColor: color.primary, backgroundColor: on ? color.primaryTint : 'transparent' }}>
                    <FoodIcon food={f} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={{ fontSize: font.label, fontWeight: on ? '800' : '600', color: color.text }}>{f.name}</Text>
                      <Text style={{ fontSize: font.body * 0.85, color: color.muted }}>{f.sub}</Text>
                    </View>
                    {on ? (
                      <View accessible={false} importantForAccessibility="no-hide-descendants" style={{ minHeight: 56, paddingVertical: 8, minWidth: 120, paddingHorizontal: 12, borderRadius: 12, backgroundColor: color.primary, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: font.body, fontWeight: '800', color: color.primaryText, textAlign: 'center' }}>{t('food.show')}</Text>
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}
        {list.length > 0 ? <Body>{t('food.hint')}</Body> : null}
        <BigButton variant="secondary" label={t('food.backGroups')} onPress={onBack} />
        <Text style={{ fontSize: font.body * 0.8, color: color.muted }}>{t('food.iconCredit')}</Text>
        <DisclaimerFooter />
      </Screen>
    </ScrollView>
  );
}

function Detail({ group, food, onSwitch, onAnother, onGroups }: { group: FoodGroup; food: Food; onSwitch: (f: Food) => void; onAnother: () => void; onGroups: () => void }) {
  const color = useColors();
  const { t, lang } = useI18n();
  const [open, setOpen] = useState(false);
  const [country, setCountry] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    let alive = true;
    supabase.from('profiles').select('country_code').maybeSingle().then(({ data }) => { if (alive) setCountry(data?.country_code ?? null); }, () => { if (alive) setCountry(null); });
    return () => { alive = false; };
  }, []);
  const [myConds, setMyConds] = useState<string[] | null | undefined>(undefined);
  useEffect(() => { let alive = true; void loadMyConditionIds().then((ids) => { if (alive) setMyConds(ids); }); return () => { alive = false; }; }, []);
  const checks = useMemo(() => (myConds && country ? foodCheck(food.name, myConds, country as Country) : []), [myConds, country, food.name]);
  const [form, setForm] = useState<FormKind | null>(null);
  const a = country === undefined ? null : amountsFor(food.id, country, form, lang);
  const same = useMemo(() => FOODS.filter((f) => f.group === group).sort((x, y) => x.sub.localeCompare(y.sub) || x.name.localeCompare(y.name)), [group]);
  return (
    <ScrollView>
      <Screen>
        <Text style={{ fontSize: font.body, color: color.muted }}>{`${t(`foodgrp.${group}` as Key)} › ${food.sub}`}</Text>
        {/* Name and a Back button on one row. A long name pushes the button under it; right-to-left languages flip the row. */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', columnGap: 12, rowGap: 8 }}>
          <View style={{ flexGrow: 1, flexShrink: 1, flexBasis: 220, minWidth: 0 }}>
            <H1>{food.name}</H1>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={t('food.another')} onPress={onAnother}
            style={{ minHeight: 56, paddingVertical: 8, minWidth: 96, paddingHorizontal: 18, borderRadius: 14, borderWidth: 2, borderColor: color.primary, backgroundColor: color.surface, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: font.label, fontWeight: '800', color: color.primary }}>{t('food.backShort')}</Text>
          </Pressable>
        </View>
        <Panel>
          {a ? (
            <>
              <Text accessibilityRole="header" style={{ fontSize: font.label, fontWeight: '800', color: color.text }}>{t('food.amounts')}</Text>
              {a.forms.filter((f) => f !== 'other').length > 1 ? (
                <View accessibilityRole="radiogroup" accessibilityLabel={t('food.formPick')} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                  {a.forms.filter((f) => f !== 'other').map((f) => {
                    const on = f === a.form;
                    return (
                      <Pressable key={f} accessibilityRole="radio" accessibilityState={{ selected: on, checked: on }} onPress={() => setForm(f)}
                        style={{ flex: 1, minWidth: 120, minHeight: 64, paddingVertical: 8, borderRadius: 14, borderWidth: 2, borderColor: color.primary, backgroundColor: on ? color.primary : color.surface, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: font.label, fontWeight: '800', color: on ? color.primaryText : color.primary }}>{t(`food.form.${f}` as Key)}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}
              {a.missing ? <Body>{t('food.formMissing', { form: t(`food.form.${a.missing}` as Key) })}</Body> : null}
              <Body>{t('food.serving', { serving: a.serving })}</Body>
              {a.variant ? <Body>{t('food.variant')}</Body> : null}
              {a.rows.map((r) => (
                <View key={r.nutrient} style={{ minHeight: 48, justifyContent: 'center' }}>
                  <Text style={{ fontSize: font.body, color: color.text }}>
                    <Text style={{ fontWeight: '700' }}>{`${t(`food.n.${r.nutrient}` as Key)} `}</Text>
                    {r.value === null ? t('food.notAvail') : `${r.value} ${t(r.nutrient === 'proteinG' ? 'food.unit.g' : 'food.unit.mg')}`}
                  </Text>
                  {r.value !== null && r.cls ? <Text style={{ fontSize: font.body * 0.85, fontWeight: r.cls === 'review' ? '800' : '400', color: r.cls === 'review' ? color.text : color.muted }}>{r.cls === 'review' ? t(`food.rv.${reviewReason(r.src)}` as Key) : t(`food.cls.${r.cls}` as Key)}</Text> : null}
                </View>
              ))}
              <Body>{t('food.perServing')}</Body>
              <Pressable accessibilityRole="link" onPress={() => Linking.openURL(a.url)} style={{ minHeight: 56, paddingVertical: 8, justifyContent: 'center' }}>
                <Text style={{ fontSize: font.body, color: color.primary, textDecorationLine: 'underline' }}>
                  {a.source === 'cnf' ? t('food.srcCnf', { name: a.recordName, id: String(a.recordId), date: a.checkedOn }) : t('food.srcUsda', { file: a.file ?? '', name: a.recordName, id: String(a.recordId), date: a.checkedOn })}
                </Text>
              </Pressable>
              <Body>{t('food.refOnly')}</Body>
            </>
          ) : (
            <>
              <Text accessibilityRole="header" style={{ fontSize: font.label, fontWeight: '800', color: color.text }}>{t('food.noNumbers')}</Text>
              <Body>{t('food.about', { name: food.name, group: t(`foodgrp.${group}` as Key), sub: food.sub })}</Body>
              <Body>{t('food.notChecked')}</Body>
              <UsdaLookup initial={food.name} />
              <Text accessibilityRole="header" style={{ fontSize: font.label, fontWeight: '800', color: color.text }}>{t('food.lookup.title')}</Text>
              {lookupLinks(food.name, country, lang).map((l) => (
                <Pressable key={l.kind} accessibilityRole="link" onPress={() => Linking.openURL(l.url)} style={{ minHeight: 56, paddingVertical: 8, justifyContent: 'center' }}>
                  <Text style={{ fontSize: font.body, color: color.primary, textDecorationLine: 'underline' }}>{t(`food.lookup.${l.kind}` as Key, { name: food.name })}</Text>
                </Pressable>
              ))}
              <Body>{t('food.lookup.note')}</Body>
            </>
          )}
        </Panel>
        <Panel>
          <Text accessibilityRole="header" style={{ fontSize: font.label, fontWeight: '800', color: color.text }}>{t('food.check.title')}</Text>
          {myConds === undefined || country === undefined ? null : !myConds || myConds.length === 0 ? <Body>{t('food.check.noConds')}</Body> : checks.length === 0 ? <Body>{t('food.check.none')}</Body> : checks.map((l) => (
            <View key={`${l.condition}|${l.src}|${l.quote}`} style={{ gap: 6 }}>
              <Text style={{ fontSize: font.body, fontWeight: '700', color: color.text }}>{t('food.check.for', { condition: l.conditionLabel })}</Text>
              <Text style={{ fontSize: font.body, lineHeight: 26, color: color.text }}>{'“'}{l.quote}{l.list ? ':' : ''}{'”'}</Text>
              {l.list ? <Text style={{ fontSize: font.body, color: color.muted }}>{t('food.check.listed', { food: l.foodEntry })}</Text> : null}
              <Text style={{ fontSize: font.body, color: color.muted }}>{t('cond.source', { source: l.source.publisher })}</Text>
              <Text style={{ fontSize: font.body, color: color.muted }}>{t('cond.reviewed', { page: l.source.dateText ?? t('cond.noDate'), checked: l.source.checkedOn })}</Text>
              <Pressable accessibilityRole="link" onPress={() => Linking.openURL(l.source.url)} style={{ minHeight: 48, justifyContent: 'center' }}>
                <Text style={{ fontSize: font.body, fontWeight: '700', color: color.primary, textDecorationLine: 'underline' }}>{t('cond.openPage')}</Text>
              </Pressable>
            </View>
          ))}
          <Body>{t('tiles.askDoctor')}</Body>
        </Panel>
        <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen(!open)}
          style={{ minHeight: 56, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, borderRadius: 14, borderWidth: 2, borderColor: color.border, backgroundColor: color.surface }}>
          <Text style={{ fontSize: font.label, fontWeight: '700', color: color.text }}>{t('food.switch')}</Text>
          <Text style={{ fontSize: font.label, color: color.text }}>{open ? '▴' : '▾'}</Text>
        </Pressable>
        {open ? (
          <View style={{ maxHeight: 320, borderWidth: 2, borderColor: color.border, borderRadius: 14, backgroundColor: color.surface, overflow: 'hidden' }}>
            <ScrollView nestedScrollEnabled>
              {same.map((f) => (
                <Pressable key={f.id} accessibilityRole="button" accessibilityState={{ selected: f.id === food.id }} onPress={() => onSwitch(f)}
                  style={{ minHeight: 56, paddingVertical: 8, justifyContent: 'center', paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: color.border }}>
                  <Text style={{ fontSize: font.body, fontWeight: f.id === food.id ? '800' : '500', color: color.text }}>{f.name}</Text>
                  <Text style={{ fontSize: font.body * 0.85, color: color.muted }}>{f.sub}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}
        <BigButton label={t('food.another')} onPress={onAnother} />
        <BigButton variant="secondary" label={t('food.backGroups')} onPress={onGroups} />
        <Body>{t('food.step')}</Body>
        <DisclaimerFooter />
      </Screen>
    </ScrollView>
  );
}
