import { useCallback, useEffect, useRef, useState } from 'react';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { Body } from '@/components/ui';
import { TILE_KEYS, TILE_SOURCES, tileItems, visibleGroups, type FoodGroup, type TileItem, type TileKey } from '@/content/conditionTiles';
import { useI18n } from '@/i18n/I18nProvider';
import type { Key } from '@/i18n/strings/en';
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
export function ConditionTiles({ country, condition, conditionLabel, accent }: { country: Country; condition: string; conditionLabel: string; accent: AccentName }) {
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
    if (item) return <Detail item={item} tile={detail.tile} conditionLabel={conditionLabel} accent={ac} mine={mine} onBack={() => setDetail(null)} />;
  }

  return (
    <View style={{ gap: 10 }}>
      {TILE_KEYS.map((k) => {
        const items = tileItems(condition, country, k);
        const isOpen = open === k;
        return (
          <View key={k} style={{ gap: 8 }}>
            <Pressable accessibilityRole="button" accessibilityState={{ expanded: isOpen }} onPress={() => setOpen(isOpen ? null : k)}
              style={{ minHeight: 56, borderRadius: 12, borderWidth: 2, borderColor: ac, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, backgroundColor: mix(ac, color.surface, 0.06) }}>
              <Text style={{ flex: 1, fontSize: font.label, fontWeight: '700', color: ac }}>{t(TITLE[k])}{items.length ? ` (${items.length})` : ''}</Text>
              <Text style={{ fontSize: font.label, fontWeight: '800', color: ac }}>{isOpen ? t('common.hide') : t('common.show')}</Text>
            </Pressable>
            {isOpen ? (
              items.length === 0
                ? <Body>{k === 'home' ? t('tiles.noHome') : k === 'avoid' && tileItems(condition, country, 'moderate').length > 0 ? t('tiles.emptyAvoid') : t('tiles.empty')}</Body>
                : <Row items={items} index={idx[k] ?? 0} onIndex={(n) => setIdx({ ...idx, [k]: n })} onOpen={(i) => setDetail({ tile: k, i })} accent={ac} mine={mine} />
            ) : null}
            {isOpen ? <Text style={{ fontSize: font.body, color: color.muted }}>{t('tiles.askDoctor')}</Text> : null}
          </View>
        );
      })}
    </View>
  );
}

function Row({ items, index, onIndex, onOpen, accent, mine }: { items: TileItem[]; index: number; onIndex: (n: number) => void; onOpen: (i: number) => void; accent: string; mine: string[] }) {
  const color = useColors();
  const { t } = useI18n();
  const ref = useRef<{ scrollTo: (o: { x: number; y?: number; animated?: boolean }) => void } | null>(null);
  const [w, setW] = useState(0);
  const go = useCallback((n: number) => { const c = Math.max(0, Math.min(items.length - 1, n)); onIndex(c); ref.current?.scrollTo({ x: c * w, animated: true }); }, [items.length, w, onIndex]);
  return (
    <View style={{ gap: 8 }} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      {w > 0 ? (
        <ScrollView ref={ref as never} horizontal pagingEnabled showsHorizontalScrollIndicator={false} contentOffset={{ x: index * w, y: 0 }}
          onMomentumScrollEnd={(e) => onIndex(Math.round(e.nativeEvent.contentOffset.x / w))}>
          {items.map((item, i) => (
            <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={`${item.title}. ${t('tiles.tapSee')}`} onPress={() => onOpen(i)}
              style={{ width: w, minHeight: 110, borderRadius: 14, borderWidth: 2, borderColor: accent, backgroundColor: color.surface, padding: 14, justifyContent: 'center', gap: 6 }}>
              <Text style={{ fontSize: font.label, fontWeight: '800', color: color.text }}>{item.title}</Text>
              {item.medIds?.some((m) => mine.includes(m)) ? <Text style={{ fontSize: font.body, fontWeight: '700', color: accent }}>{t('tiles.inMeds')}</Text> : null}
              <Text style={{ fontSize: font.body, color: color.muted }}>{t('tiles.tapSee')}</Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <SmallBtn label={t('tiles.prev')} accent={accent} disabled={index <= 0} onPress={() => go(index - 1)} />
        <Text accessibilityLiveRegion="polite" style={{ fontSize: font.label, fontWeight: '700', color: color.text }}>{t('tiles.count', { n: index + 1, total: items.length })}</Text>
        <SmallBtn label={t('tiles.next')} accent={accent} disabled={index >= items.length - 1} onPress={() => go(index + 1)} />
      </View>
    </View>
  );
}

function Detail({ item, tile, conditionLabel, accent, mine, onBack }: { item: TileItem; tile: TileKey; conditionLabel: string; accent: string; mine: string[]; onBack: () => void }) {
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
      <Pressable accessibilityRole="link" onPress={() => Linking.openURL(s.url)} style={{ minHeight: 56, justifyContent: 'center' }}>
        <Text style={{ fontSize: font.label, fontWeight: '700', color: color.primary, textDecorationLine: 'underline' }}>{t('cond.openPage')}</Text>
      </Pressable>
      {visibleGroups(item).length ? <FoodGroups groups={visibleGroups(item)} accent={accent} /> : null}
      <Text style={{ fontSize: font.body, color: color.muted }}>{t('tiles.askDoctor')}</Text>
    </View>
  );
}

// Foods an official page names for this card. Each group keeps its own quote, source, link and check date.
function FoodGroups({ groups, accent }: { groups: FoodGroup[]; accent: string }) {
  const color = useColors();
  const { t } = useI18n();
  return (
    <View style={{ gap: 12 }}>
      <Text accessibilityRole="header" style={{ fontSize: font.label, fontWeight: '800', color: accent }}>{t('tiles.foodsNamed')}</Text>
      {groups.map((g, i) => {
        const gs = TILE_SOURCES[g.src];
        return (
          <View key={i} style={{ gap: 6, borderLeftWidth: 4, borderLeftColor: accent, paddingLeft: 10 }}>
            <Text style={{ fontSize: font.body, lineHeight: 26, color: color.text }}>{'“'}{g.quote}{g.list && !/[?:]$/.test(g.quote) ? ':' : ''}{'”'}</Text>
            {g.list ? <Text style={{ fontSize: font.body, color: color.muted }}>{t('tiles.listOnPage')}</Text> : null}
            {g.list ? g.foods.map((f) => <Text key={f} style={{ fontSize: font.body, color: color.text }}>{'• '}{f}</Text>) : null}
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
