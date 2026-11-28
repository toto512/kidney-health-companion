import { Pressable, Text, View } from 'react-native';
import { BigButton } from '@/components/ui';
import { useI18n } from '@/i18n/I18nProvider';
import { DAY_BITS, EVERY_DAY, toggleDay, weekdayName } from '@/lib/myDayLogic';
import { font, MIN_TOUCH, useColors } from '@/theme/tokens';

// Seven day buttons (Monday first) as check boxes, plus one button for every day. `value` is the day bit mask.
export function DayPicker({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  const { t, lang } = useI18n();
  const color = useColors();
  return (
    <View style={{ gap: 8 }}>
      <Text style={{ fontSize: font.label, fontWeight: '600', color: color.text }}>{label}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {DAY_BITS.map((bit, i) => {
          const on = (value & bit) !== 0;
          return (
            <Pressable key={bit} accessibilityRole="checkbox" accessibilityState={{ checked: on }} accessibilityLabel={weekdayName(i, lang, 'long')} onPress={() => onChange(toggleDay(value, bit))}
              style={{ minWidth: 64, minHeight: MIN_TOUCH, paddingVertical: 8, paddingHorizontal: 8, borderRadius: 12, borderWidth: 2, borderColor: color.primary, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? color.primary : color.bg }}>
              <Text style={{ fontSize: font.label, fontWeight: '700', color: on ? color.primaryText : color.primary }}>{weekdayName(i, lang, 'short')}</Text>
            </Pressable>
          );
        })}
      </View>
      <BigButton variant="secondary" label={t('myday.allDays')} onPress={() => onChange(EVERY_DAY)} />
    </View>
  );
}
