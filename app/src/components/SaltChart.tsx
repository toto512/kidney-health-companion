import { useState } from 'react';
import { Text, View } from 'react-native';
import Svg, { G, Line, Rect, Text as SvgText } from 'react-native-svg';
import { useI18n } from '@/i18n/I18nProvider';
import { calendarDate } from '@/i18n/core';
import { axis, type SaltPoint } from '@/lib/saltLog';
import { font, useColors } from '@/theme/tokens';

const H = 220;
const PAD = { l: 56, r: 12, t: 12, b: 32 };

// Daily sodium bars in one neutral colour. No target line, no colour that says good or bad. Days with nothing saved have no bar (a gap, not a zero).
// The drawing is hidden from screen readers: the day list on the screen carries the same numbers.
export function SaltChart({ points }: { points: SaltPoint[] }) {
  const color = useColors();
  const { t, lang } = useI18n();
  const [w, setW] = useState(0);
  const { max, ticks } = axis(points);
  const iw = w - PAD.l - PAD.r; const ih = H - PAD.t - PAD.b;
  const slot = iw / points.length;
  const bar = Math.max(4, Math.min(28, slot * 0.7));
  const Y = (v: number) => PAD.t + (1 - v / max) * ih;
  const dayName = (iso: string) => calendarDate(new Date(`${iso}T12:00:00`), lang, { month: 'short', day: 'numeric' });
  const last = points.length - 1;
  return (
    <View style={{ gap: 8 }}>
      <View onLayout={(e) => setW(e.nativeEvent.layout.width)} accessible={false} importantForAccessibility="no-hide-descendants">
        {w > 0 ? (
          <Svg width={w} height={H}>
            {ticks.map((v) => (
              <G key={v}>
                <Line x1={PAD.l} x2={w - PAD.r} y1={Y(v)} y2={Y(v)} stroke={color.border} strokeWidth={1} />
                <SvgText x={PAD.l - 8} y={Y(v) + 6} fontSize={18} fill={color.muted} textAnchor="end">{v}</SvgText>
              </G>
            ))}
            {points.map((p, i) => p.mg === null ? null : (
              <Rect key={p.day} x={PAD.l + slot * i + (slot - bar) / 2} y={Y(p.mg)} width={bar} height={Math.max(2, PAD.t + ih - Y(p.mg))} rx={3} fill={color.accent.blue} />
            ))}
            <SvgText x={PAD.l + slot / 2} y={H - 8} fontSize={18} fill={color.muted} textAnchor="start">{dayName(points[0].day)}</SvgText>
            <SvgText x={PAD.l + slot * last + slot / 2} y={H - 8} fontSize={18} fill={color.muted} textAnchor="end">{dayName(points[last].day)}</SvgText>
          </Svg>
        ) : <View style={{ height: H }} />}
      </View>
      <Text style={{ fontSize: font.body, color: color.muted }}>{t('salt.chartUnit')}</Text>
    </View>
  );
}
