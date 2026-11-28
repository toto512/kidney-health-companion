import { Linking, Pressable, Text, View } from 'react-native';
import { Panel } from '@/components/ui';
import { useI18n } from '@/i18n/I18nProvider';
import type { Key } from '@/i18n/strings/en';
import type { PlateFlag, PlateRow } from '@/lib/plateCheck';
import { font, useColors } from '@/theme/tokens';

const MARK: Record<PlateFlag, string> = { avoid: '✕', limit: '!', none: '?' };

// One food on the plate: its flag and every official line (quote, publisher, dates, link) that names it. Shared by the plate photo and the plate scan.
export function PlateFlagCard({ row: r }: { row: PlateRow }) {
  const { t } = useI18n();
  const color = useColors();
  return (
    <Panel tone={r.flag === 'avoid' ? 'danger' : undefined}>
      <Text style={{ fontSize: font.label, fontWeight: '800', color: color.text }}>{`${MARK[r.flag]}  ${r.name}`}</Text>
      <Text style={{ fontSize: font.body, fontWeight: '700', color: color.text }}>{t(`plate.flag.${r.flag}` as Key)}</Text>
      {r.lines.map((l) => (
        <View key={`${l.condition}|${l.src}|${l.quote}`} style={{ gap: 4 }}>
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
    </Panel>
  );
}
