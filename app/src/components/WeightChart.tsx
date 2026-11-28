import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Svg, { Circle, G, Line, Polyline, Text as SvgText } from 'react-native-svg';
import { BigButton, Body, Segmented } from '@/components/ui';
import { useI18n } from '@/i18n/I18nProvider';
import { dateTimeText, dayText } from '@/i18n/bpText';
import { localeTag } from '@/i18n/core';
import { formatWeight, fromKg, type WeightUnit } from '@/lib/weight';
import { changeInWindow, RANGES, type RangeDays, type WeightRow, weightScale, weightSpan, windowWeights } from '@/lib/weightChart';
import { xFraction } from '@/lib/bpChart';
import { font, useColors } from '@/theme/tokens';

const H = 260;
const PAD = { l: 56, r: 16, t: 14, b: 34 };
const DAY = 86_400_000;

// One line of weights over time in the chosen unit. No target line, no bands, no good or bad colours.
export function WeightChart({ rows, unit }: { rows: WeightRow[]; unit: WeightUnit }) {
  const color = useColors();
  const { t, lang } = useI18n();
  const loc = localeTag(lang);
  const [days, setDays] = useState<RangeDays>(30);
  const [w, setW] = useState(0);
  const [sel, setSel] = useState<number | null>(null);
  const now = useMemo(() => Date.now(), [rows, days]);
  const data = useMemo(() => windowWeights(rows, days, now), [rows, days, now]);
  const count = t(data.length === 1 ? 'weight.one' : 'weight.many', { n: data.length });
  const span = weightSpan(data, unit);
  const change = changeInWindow(data, unit);
  const fmt = (v: number) => v.toLocaleString(loc, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const summary = !span ? t('weight.noneRange', { days })
    : span.lo === span.hi ? t('weight.summaryOne', { days, count, lo: fmt(span.lo), unit })
    : t('weight.summary', { days, count, lo: fmt(span.lo), hi: fmt(span.hi), unit });
  const changeText = change === null ? '' : t('weight.change', { change: `‎${change > 0 ? '+' : ''}${fmt(change)}`, unit });
  const from = now - days * DAY;
  const idx = sel !== null && sel < data.length ? sel : null;
  const picked = idx !== null ? data[idx] : null;

  return (
    <View style={{ gap: 12 }}>
      <Segmented label={t('chart.range')} value={days} options={RANGES.map((d) => ({ value: d, label: t('chart.days', { n: d }) }))} onChange={(d) => { setDays(d); setSel(null); }} />
      <Text accessibilityRole="text" accessibilityLabel={`${summary} ${changeText}`} style={{ fontSize: font.body, color: color.text }}>{summary}{changeText ? ` ${changeText}` : ''}</Text>
      {data.length < 2 ? <Body>{t('weight.needTwo')}</Body> : (
        <>
          <View onLayout={(e) => setW(e.nativeEvent.layout.width)} accessible={false} importantForAccessibility="no-hide-descendants">
            {w > 0 ? (() => {
              const { min, max, ticks } = weightScale(data, unit);
              const iw = w - PAD.l - PAD.r; const ih = H - PAD.t - PAD.b;
              const X = (ts: number) => PAD.l + xFraction(ts, from, now) * iw;
              const Y = (v: number) => PAD.t + (1 - (v - min) / (max - min)) * ih;
              const val = (r: WeightRow) => fromKg(r.weight_kg, unit);
              const pts = data.map((r) => `${X(Date.parse(r.taken_at))},${Y(val(r))}`).join(' ');
              const xl = [from, from + (now - from) / 2, now];
              return (
                <View style={{ width: w, height: H }}>
                  <Svg width={w} height={H}>
                    {ticks.map((v) => (
                      <G key={v}>
                        <Line x1={PAD.l} x2={w - PAD.r} y1={Y(v)} y2={Y(v)} stroke={color.border} strokeWidth={1} />
                        <SvgText x={PAD.l - 8} y={Y(v) + 6} fontSize={18} fill={color.muted} textAnchor="end">{v}</SvgText>
                      </G>
                    ))}
                    {xl.map((ts, i) => <SvgText key={i} x={i === 0 ? PAD.l : i === 2 ? w - PAD.r : PAD.l + iw / 2} y={H - 8} fontSize={18} fill={color.muted} textAnchor={i === 0 ? 'start' : i === 2 ? 'end' : 'middle'}>{dayText(ts, lang)}</SvgText>)}
                    <Polyline points={pts} fill="none" stroke={color.accent.blue} strokeWidth={3} />
                    {data.map((r, i) => {
                      const x = X(Date.parse(r.taken_at)); const on = i === idx;
                      return (
                        <G key={r.id}>
                          {on ? <Line x1={x} x2={x} y1={PAD.t} y2={PAD.t + ih} stroke={color.outline} strokeWidth={2} /> : null}
                          <Circle cx={x} cy={Y(val(r))} r={on ? 9 : 6} fill={color.accent.blue} stroke={color.bg} strokeWidth={2} />
                        </G>
                      );
                    })}
                  </Svg>
                  {/* Tap targets are plain React Native views over the drawing: responder props on svg shapes warn on web. */}
                  {data.map((r, i) => (
                    <Pressable key={r.id} accessible={false} onPress={() => setSel(i)} style={{ position: 'absolute', left: X(Date.parse(r.taken_at)) - 22, top: PAD.t, width: 44, height: ih }} />
                  ))}
                </View>
              );
            })() : <View style={{ height: H }} />}
          </View>
          <Text accessibilityLiveRegion="polite" style={{ fontSize: font.label, fontWeight: '700', color: color.text }}>
            {picked ? t('weight.picked', { when: dateTimeText(picked.taken_at, lang), weight: formatWeight(picked.weight_kg, unit, loc), unit }) : t('weight.tapPoint')}
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1 }}><BigButton variant="secondary" label={t('chart.earlier')} disabled={idx === 0} onPress={() => setSel(idx === null ? data.length - 1 : Math.max(0, idx - 1))} /></View>
            <View style={{ flex: 1 }}><BigButton variant="secondary" label={t('chart.later')} disabled={idx === data.length - 1} onPress={() => setSel(idx === null ? data.length - 1 : Math.min(data.length - 1, idx + 1))} /></View>
          </View>
        </>
      )}
      <Text style={{ fontSize: font.body, color: color.muted }}>{t('weight.disclaimer')}</Text>
    </View>
  );
}
