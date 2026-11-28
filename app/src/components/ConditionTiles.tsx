import { useEffect, useRef, useState } from 'react';
import { Linking, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { BigButton, Body } from '@/components/ui';
import { TILE_KEYS, TILE_SOURCES, tileItems, visibleGroups, type FoodGroup, type TileItem, type TileKey } from '@/content/conditionTiles';
import { useI18n } from '@/i18n/I18nProvider';
import type { Key } from '@/i18n/strings/en';
import { stricterElsewhere } from '@/lib/foodConflicts';
import { loadMyMeds } from '@/lib/userMedications';
import type { Country } from '@/lib/profile';
import { AccentName, font, mix, useColors } from '@/theme/tokens';

const TITLE: Record<TileKey, Key> = { avoid: 'tiles.avoid', moderate: 'tiles.moderate', activity: 'tiles.activity', home: 'tiles.home', meds: 'tiles.meds' };

function SmallBtn({ label, a11y, onPress, disabled, accent }: { label: string; a11y?: string; onPress: () => void; disabled?: boolean; accent: string }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={a11y ?? label} disabled={disabled} onPress={onPress}
      style={{ minHeight: 48, minWidth: 48, paddingHorizontal: 14, borderRadius: 10, borderWidth: 2, borderColor: accent, alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.4 : 1 }}>
      <Text style={{ fontSize: font.body, fontWeight: '700', color: accent }}>{label}</Text>
    </Pressable>
  );
}

// Five tiles for one condition in the person's country. Each opens a swipe row (one card per item, Previous and Next buttons, "2 of 6", no automatic movement).
// Tapping a card shows the exact official quote with its source, link and check date. Back returns to the same card.
export function ConditionTiles({ country, condition, conditionLabel, accent, others = [] }: { country: Country; condition: string; conditionLabel: string; accent: AccentName; others?: { id: string; label: string }[] }) {
  const color = useColors();
  const { t } = useI18n();
  const ac = color.accent[accent];
  const [open, setOpen] = useState<TileKey | null>(null);
  const [idx, setIdx] = useState<Record<string, number>>({});
  const [detail, setDetail] = useState<{ tile: TileKey; i: number } | null>(null);
  const [mine, setMine] = useState<string[]>([]);
  useEffect(() => { void loadMyMeds().then((m) => setMine(m?.ids ?? [])); }, []);

  if (detail) {
    const item = tileItems(condition, country, detail.tile)[detail.i];
    if (item) return <Detail item={item} tile={detail.tile} condition={condition} country={country} others={others} conditionLabel={conditionLabel} accent={ac} mine={mine} onBack={() => setDetail(null)} />;
  }

  return (
    <View style={{ gap: 10 }}>
      {TILE_KEYS.map((k) => {
        const items = tileItems(condition, country, k);
        const isOpen = open === k;
        return (
          <View key={k} style={{ gap: 8 }}>
            <Pressable accessibilityRole="button" accessibilityState={{ expanded: isOpen }} onPress={() => setOpen(isOpen ? null : k)}
              style={{ minHeight: 56, paddingVertical: 8, borderRadius: 12, borderWidth: 2, borderColor: ac, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, backgroundColor: mix(ac, color.surface, 0.06) }}>
              <Text style={{ flex: 1, fontSize: font.label, fontWeight: '700', color: ac }}>{t(TITLE[k])}{items.length ? ` (${items.length})` : ''}</Text>
              <Text style={{ fontSize: font.label, fontWeight: '800', color: ac }}>{isOpen ? t('common.hide') : t('common.show')}</Text>
            </Pressable>
            {isOpen ? (
              items.length === 0
                ? <Body>{k === 'home' ? t('tiles.noHome') : k === 'avoid' && tileItems(condition, country, 'moderate').length > 0 ? t('tiles.emptyAvoid') : t('tiles.empty')}</Body>
                : <Row title={t(TITLE[k])} items={items} index={idx[k] ?? 0} onIndex={(n) => setIdx({ ...idx, [k]: n })} onOpen={(i) => setDetail({ tile: k, i })} accent={ac} mine={mine} />
            ) : null}
            {isOpen ? <Text style={{ fontSize: font.body, color: color.muted }}>{t('tiles.askDoctor')}</Text> : null}
          </View>
        );
      })}
    </View>
  );
}

// The same list the Food page uses: a bordered list, the chosen row highlighted with a big "Show details" button, one tap on another row chooses it.
// Short lists have no inner scrolling; a long one scrolls inside its box (nestedScrollEnabled, so the page still scrolls from outside the box).
const ROW_H = 72;
const LIST_MAX = 380;
function Row({ items, index, onIndex, onOpen, accent, mine, title }: { items: TileItem[]; index: number; onIndex: (n: number) => void; onOpen: (i: number) => void; accent: string; mine: string[]; title: string }) {
  const color = useColors();
  const { t } = useI18n();
  const sel = Math.max(0, Math.min(items.length - 1, index));
  const scroller = useRef<{ scrollTo: (o: { x?: number; y?: number; animated?: boolean }) => void } | null>(null);
  const tall = items.length * ROW_H + 8 > LIST_MAX;
  const choose = (i: number) => { onIndex(i); if (tall) scroller.current?.scrollTo({ y: Math.max(0, i * ROW_H - ROW_H), animated: true }); };
  const keys = Platform.OS === 'web' ? ({ tabIndex: 0, onKeyDown: (e: { key: string; preventDefault: () => void }) => {
    const k: Record<string, () => void> = { ArrowDown: () => choose(Math.min(items.length - 1, sel + 1)), ArrowUp: () => choose(Math.max(0, sel - 1)), Enter: () => onOpen(sel) };
    if (k[e.key]) { e.preventDefault(); k[e.key](); }
  } } as object) : {};
  return (
    <View accessibilityRole="list" accessibilityLabel={title} {...keys}
      style={{ height: tall ? LIST_MAX : undefined, borderWidth: 2, borderColor: color.border, borderRadius: 16, backgroundColor: color.surface, overflow: 'hidden' }}>
      <ScrollView ref={scroller as never} nestedScrollEnabled scrollEnabled={tall}>
        {items.map((item, i) => {
          const on = i === sel;
          const inMeds = item.medIds?.some((m) => mine.includes(m));
          return (
            <Pressable key={item.id} accessibilityRole="button" accessibilityState={{ selected: on }} accessibilityLabel={item.title} accessibilityHint={on ? t('tiles.tapSee') : undefined}
              onPress={() => { if (on) onOpen(i); else choose(i); }}
              style={{ minHeight: ROW_H - 8, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6, paddingStart: 14, paddingEnd: 8, margin: 4, borderRadius: 12, borderWidth: on ? 2 : 0, borderColor: accent, backgroundColor: on ? mix(accent, color.surface, 0.1) : 'transparent' }}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontSize: font.label, fontWeight: on ? '800' : '600', color: color.text }}>{item.title}</Text>
                {inMeds ? <Text style={{ fontSize: font.body * 0.85, fontWeight: '700', color: accent }}>{t('tiles.inMeds')}</Text> : null}
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
  );
}

function Detail({ item, tile, condition, country, others, conditionLabel, accent, mine, onBack }: { item: TileItem; tile: TileKey; condition: string; country: Country; others: { id: string; label: string }[]; conditionLabel: string; accent: string; mine: string[]; onBack: () => void }) {
  const color = useColors();
  const { t } = useI18n();
  const s = TILE_SOURCES[item.src];
  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <Text accessibilityRole="header" style={{ flex: 1, fontSize: font.label, fontWeight: '800', color: accent }}>{t(TITLE[tile])}</Text>
        <SmallBtn label={t('tiles.back')} accent={accent} onPress={onBack} />
      </View>
      <Text style={{ fontSize: font.label, fontWeight: '800', color: color.text }}>{item.title}</Text>
      {item.medIds?.some((m) => mine.includes(m)) ? <Text style={{ fontSize: font.body, fontWeight: '700', color: accent }}>{t('tiles.inMeds')}</Text> : null}
      <Body>{t('tiles.why', { cond: conditionLabel })}</Body>
      {item.quotes.map((q, i) => <Text key={i} style={{ fontSize: font.body, lineHeight: 26, color: color.text }}>{'“'}{q}{'”'}</Text>)}
      <Text style={{ fontSize: font.body, color: color.muted }}>{t('cond.source', { source: s.publisher })}</Text>
      <Text style={{ fontSize: font.body, color: color.muted }}>{t('cond.reviewed', { page: s.dateText ?? t('cond.noDate'), checked: s.checkedOn })}</Text>
      {s.nextReviewDue && new Date(s.nextReviewDue).getTime() < Date.now() ? <Text style={{ fontSize: font.body, fontWeight: '700', color: color.danger }}>{t('cond.overdue')}</Text> : null}
      <Pressable accessibilityRole="link" onPress={() => Linking.openURL(s.url)} style={{ minHeight: 56, paddingVertical: 8, justifyContent: 'center' }}>
        <Text style={{ fontSize: font.label, fontWeight: '700', color: color.primary, textDecorationLine: 'underline' }}>{t('cond.openPage')}</Text>
      </Pressable>
      {visibleGroups(item).length ? <FoodGroups groups={visibleGroups(item)} accent={accent} tile={tile} condition={condition} country={country} others={others} /> : null}
      <Text style={{ fontSize: font.body, color: color.muted }}>{t('tiles.askDoctor')}</Text>
    </View>
  );
}

// Foods an official page names for this card. Each group keeps its own quote, source, link and check date.
function FoodGroups({ groups, accent, tile, condition, country, others }: { groups: FoodGroup[]; accent: string; tile: TileKey; condition: string; country: Country; others: { id: string; label: string }[] }) {
  const color = useColors();
  const { t } = useI18n();
  return (
    <View style={{ gap: 12 }}>
      <Text accessibilityRole="header" style={{ fontSize: font.label, fontWeight: '800', color: accent }}>{t('tiles.foodsNamed')}</Text>
      {groups.map((g, i) => {
        const gs = TILE_SOURCES[g.src];
        const stricter = stricterElsewhere(g.foods, tile, condition, others, country);
        return (
          <View key={i} style={{ gap: 6, borderLeftWidth: 4, borderLeftColor: accent, paddingLeft: 10 }}>
            <Text style={{ fontSize: font.body, lineHeight: 26, color: color.text }}>{'“'}{g.quote}{g.list && !/[?:]$/.test(g.quote) ? ':' : ''}{'”'}</Text>
            {g.list ? <Text style={{ fontSize: font.body, color: color.muted }}>{t('tiles.listOnPage')}</Text> : null}
            {g.list ? <FoodList foods={g.foods} /> : null}
            {stricter.length ? (
              <View style={{ gap: 4, borderWidth: 2, borderColor: color.danger, borderRadius: 10, padding: 10 }}>
                {stricter.map((x) => <Text key={x.food} style={{ fontSize: font.body, lineHeight: 26, color: color.text }}>{t('tiles.stricter', { food: x.food, conditions: x.conditions.join(', ') })}</Text>)}
                <Text style={{ fontSize: font.body, fontWeight: '700', color: color.text }}>{t('tiles.askCare')}</Text>
              </View>
            ) : null}
            <Text style={{ fontSize: font.body, color: color.muted }}>{t('tiles.foodFrom', { source: gs.publisher })}</Text>
            <Text style={{ fontSize: font.body, color: color.muted }}>{t('cond.reviewed', { page: gs.dateText ?? t('cond.noDate'), checked: gs.checkedOn })}</Text>
            <Pressable accessibilityRole="link" onPress={() => Linking.openURL(gs.url)} style={{ minHeight: 48, justifyContent: 'center' }}>
              <Text style={{ fontSize: font.body, fontWeight: '700', color: color.primary, textDecorationLine: 'underline' }}>{t('cond.openPage')}</Text>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

export const TOP_FOODS = 5;

// A long list on an official page shows its first five foods, then a big plain button for people who want all of them.
function FoodList({ foods }: { foods: string[] }) {
  const color = useColors();
  const { t } = useI18n();
  const [all, setAll] = useState(false);
  const shown = all || foods.length <= TOP_FOODS ? foods : foods.slice(0, TOP_FOODS);
  return (
    <View style={{ gap: 6 }}>
      {shown.map((f) => <Text key={f} style={{ fontSize: font.body, lineHeight: 26, color: color.text }}>{'• '}{f}</Text>)}
      {foods.length > TOP_FOODS ? (
        <BigButton variant="secondary" label={all ? t('tiles.showFewer') : t('tiles.showAll', { n: foods.length })} onPress={() => setAll(!all)} />
      ) : null}
    </View>
  );
}
