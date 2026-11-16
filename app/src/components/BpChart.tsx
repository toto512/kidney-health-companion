import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Svg, { Circle, G, Line, Polyline, Rect, Text as SvgText } from 'react-native-svg';
import { BigButton, Body, Segmented } from '@/components/ui';
import { ChartRow, RANGES, RangeDays, summary, windowRows, xFraction, yScale } from '@/lib/bpChart';
import { font, useColors } from '@/theme/tokens';

const H = 260;
const PAD = { l: 52, r: 16, t: 14, b: 34 };
const DAY = 86_400_000;
const fmtDay = (t: number) => new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

// Top number: red circles. Bottom number: blue squares. Colour and shape both differ. No target bands, no good or bad colours.
export function BpChart({ rows }: { rows: ChartRow[] }) {
  const color = useColors();
  const [days, setDays] = useState<RangeDays>(30);
  const [w, setW] = useState(0);
  const [sel, setSel] = useState<number | null>(null);
  const now = useMemo(() => Date.now(), [rows, days]);
  const data = useMemo(() => windowRows(rows, days, now), [rows, days, now]);
  const text = summary(data, days);
  const from = now - days * DAY;
  const idx = sel !== null && sel < data.length ? sel : null;
  const picked = idx !== null ? data[idx] : null;

  const choose = (v: RangeDays) => { setDays(v); setSel(null); };

  return (
    <View style={{ gap: 12 }}>
      <Segmented label="Time range" value={days} options={RANGES.map((d) => ({ value: d, label: `${d} days` }))} onChange={choose} />
      <Text accessibilityRole="text" accessibilityLabel={text} style={{ fontSize: font.body, color: color.text }}>{text}</Text>
      {data.length < 2 ? (
        <Body>Add at least 2 readings in this time range to see your chart.</Body>
      ) : (
        <View onLayout={(e) => setW(e.nativeEvent.layout.width)} accessible={false} importantForAccessibility="no-hide-descendants">
          {w > 0 ? (() => {
            const { min, max, ticks } = yScale(data);
            const iw = w - PAD.l - PAD.r; const ih = H - PAD.t - PAD.b;
            const X = (t: number) => PAD.l + xFraction(t, from, now) * iw;
            const Y = (v: number) => PAD.t + (1 - (v - min) / (max - min)) * ih;
            const pts = (k: 'systolic' | 'diastolic') => data.map((r) => `${X(Date.parse(r.taken_at))},${Y(r[k])}`).join(' ');
            const xl = [from, from + (now - from) / 2, now];
            return (
              <Svg width={w} height={H}>
                {ticks.map((v) => (
                  <G key={v}>
                    <Line x1={PAD.l} x2={w - PAD.r} y1={Y(v)} y2={Y(v)} stroke={color.border} strokeWidth={1} />
                    <SvgText x={PAD.l - 8} y={Y(v) + 6} fontSize={18} fill={color.muted} textAnchor="end">{v}</SvgText>
                  </G>
                ))}
                {xl.map((t, i) => <SvgText key={i} x={i === 0 ? PAD.l : i === 2 ? w - PAD.r : X(t)} y={H - 8} fontSize={18} fill={color.muted} textAnchor={i === 0 ? 'start' : i === 2 ? 'end' : 'middle'}>{fmtDay(t)}</SvgText>)}
                <Polyline points={pts('systolic')} fill="none" stroke={color.accent.red} strokeWidth={3} />
                <Polyline points={pts('diastolic')} fill="none" stroke={color.accent.blue} strokeWidth={3} />
                {data.map((r, i) => {
                  const x = X(Date.parse(r.taken_at));
                  const on = i === idx;
                  return (
                    <G key={r.id}>
                      {on ? <Line x1={x} x2={x} y1={PAD.t} y2={PAD.t + ih} stroke={color.outline} strokeWidth={2} /> : null}
                      <Circle cx={x} cy={Y(r.systolic)} r={on ? 9 : 6} fill={color.accent.red} stroke={color.bg} strokeWidth={2} />
                      <Rect x={x - (on ? 8 : 5.5)} y={Y(r.diastolic) - (on ? 8 : 5.5)} width={on ? 16 : 11} height={on ? 16 : 11} fill={color.accent.blue} stroke={color.bg} strokeWidth={2} />
                      <Rect x={x - 22} y={PAD.t} width={44} height={ih} fill="transparent" onPress={() => setSel(i)} />
                    </G>
                  );
                })}
              </Svg>
            );
          })() : <View style={{ height: H }} />}
        </View>
      )}
      <View style={{ flexDirection: 'row', gap: 24, flexWrap: 'wrap' }} accessible accessibilityLabel="Legend: top number is red circles, bottom number is blue squares">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: color.accent.red }} />
          <Text style={{ fontSize: font.body, color: color.text }}>Top (SYS)</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 16, height: 16, backgroundColor: color.accent.blue }} />
          <Text style={{ fontSize: font.body, color: color.text }}>Bottom (DIA)</Text>
        </View>
      </View>
      {data.length >= 2 ? (
        <View style={{ gap: 8 }}>
          <Text accessibilityLiveRegion="polite" style={{ fontSize: font.label, fontWeight: '700', color: color.text }}>
            {picked ? `${new Date(picked.taken_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}: top ${picked.systolic}, bottom ${picked.diastolic}${picked.pulse != null ? `, pulse ${picked.pulse}` : ''}` : 'Tap a point, or use the buttons, to see one reading.'}
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1 }}><BigButton variant="secondary" label="Earlier" disabled={idx === 0} onPress={() => setSel(idx === null ? data.length - 1 : Math.max(0, idx - 1))} /></View>
            <View style={{ flex: 1 }}><BigButton variant="secondary" label="Later" disabled={idx === data.length - 1} onPress={() => setSel(idx === null ? data.length - 1 : Math.min(data.length - 1, idx + 1))} /></View>
          </View>
        </View>
      ) : null}
    </View>
  );
}
