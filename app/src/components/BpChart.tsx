import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Polyline, Rect, Text as SvgText } from 'react-native-svg';
import { BigButton, Body, Segmented } from '@/components/ui';
import { Bin, binLabel, bins, ChartRow, RANGES, RangeDays, spreadSummary, summary, weeklyAverages, weeklySummary, windowRows, xFraction, yScale } from '@/lib/bpChart';
import { font, ramp, useColors } from '@/theme/tokens';

const H = 260;
const PAD = { l: 52, r: 16, t: 14, b: 34 };
const DAY = 86_400_000;
const fmtDay = (t: number) => new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

// Top number: red circles. Bottom number: blue squares. Colour and shape both differ. No target bands, no good or bad colours.
function LineView({ data, days, now }: { data: ChartRow[]; days: number; now: number }) {
  const color = useColors();
  const [w, setW] = useState(0);
  const [sel, setSel] = useState<number | null>(null);
  const from = now - days * DAY;
  // 7 days: fit the axis to the readings. Readings on one day are spaced evenly in order, labelled with their time.
  // 30 and 90 days: the axis is the whole window, by date.
  const t0 = Date.parse(data[0].taken_at); const t1 = Date.parse(data[data.length - 1].taken_at);
  const fit = days === 7; const even = fit && new Date(t0).toDateString() === new Date(t1).toDateString();
  const lo = fit ? t0 : from; const hi = fit ? t1 : now; const inset = fit ? 12 : 0;
  const fmtTime = (t: number) => new Date(t).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  const idx = sel !== null && sel < data.length ? sel : null;
  const picked = idx !== null ? data[idx] : null;
  return (
    <View style={{ gap: 12 }}>
      {(        <View onLayout={(e) => setW(e.nativeEvent.layout.width)} accessible={false} importantForAccessibility="no-hide-descendants">
          {w > 0 ? (() => {
            const { min, max, ticks } = yScale(data);
            const iw = w - PAD.l - PAD.r; const ih = H - PAD.t - PAD.b;
            const X = (t: number, i: number) => even ? PAD.l + inset + (i / (data.length - 1)) * (iw - 2 * inset) : PAD.l + inset + xFraction(t, lo, hi) * (iw - 2 * inset);
            const Y = (v: number) => PAD.t + (1 - (v - min) / (max - min)) * ih;
            const pts = (k: 'systolic' | 'diastolic') => data.map((r, i) => `${X(Date.parse(r.taken_at), i)},${Y(r[k])}`).join(' ');
            const xl = even ? [t0, t1] : [lo, lo + (hi - lo) / 2, hi];
            const last = xl.length - 1;
            return (
              <Svg width={w} height={H}>
                {ticks.map((v) => (
                  <G key={v}>
                    <Line x1={PAD.l} x2={w - PAD.r} y1={Y(v)} y2={Y(v)} stroke={color.border} strokeWidth={1} />
                    <SvgText x={PAD.l - 8} y={Y(v) + 6} fontSize={18} fill={color.muted} textAnchor="end">{v}</SvgText>
                  </G>
                ))}
                {xl.map((t, i) => <SvgText key={i} x={i === 0 ? PAD.l : i === last ? w - PAD.r : PAD.l + iw / 2} y={H - 8} fontSize={18} fill={color.muted} textAnchor={i === 0 ? 'start' : i === last ? 'end' : 'middle'}>{even ? `${fmtDay(t)} ${fmtTime(t)}` : fmtDay(t)}</SvgText>)}
                <Polyline points={pts('systolic')} fill="none" stroke={color.accent.red} strokeWidth={3} />
                <Polyline points={pts('diastolic')} fill="none" stroke={color.accent.blue} strokeWidth={3} />
                {data.map((r, i) => {
                  const x = X(Date.parse(r.taken_at), i);
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
      {(
        <View style={{ gap: 8 }}>
          <Text accessibilityLiveRegion="polite" style={{ fontSize: font.label, fontWeight: '700', color: color.text }}>
            {picked ? `${new Date(picked.taken_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}: top ${picked.systolic}, bottom ${picked.diastolic}${picked.pulse != null ? `, pulse ${picked.pulse}` : ''}` : 'Tap a point, or use the buttons, to see one reading.'}
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1 }}><BigButton variant="secondary" label="Earlier" disabled={idx === 0} onPress={() => setSel(idx === null ? data.length - 1 : Math.max(0, idx - 1))} /></View>
            <View style={{ flex: 1 }}><BigButton variant="secondary" label="Later" disabled={idx === data.length - 1} onPress={() => setSel(idx === null ? data.length - 1 : Math.min(data.length - 1, idx + 1))} /></View>
          </View>
        </View>
      )}
    </View>
  );
}

const Swatch = ({ c, round }: { c: string; round?: boolean }) => <View style={{ width: 16, height: 16, borderRadius: round ? 8 : 3, backgroundColor: c }} />;

// Average top and bottom per 7-day block. The numbers are printed on the bars.
function WeeklyView({ weekly }: { weekly: ReturnType<typeof weeklyAverages> }) {
  const color = useColors();
  const max = Math.max(...weekly.flatMap((x) => [x.sys, x.dia]));
  const Bar = ({ v, c, tag }: { v: number; c: string; tag: string }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Text style={{ width: 44, fontSize: font.body, color: color.muted }}>{tag}</Text>
      <View style={{ flex: 1, height: 28 }}><View style={{ width: `${Math.max(2, (v / max) * 100)}%`, height: 28, borderRadius: 6, backgroundColor: c }} /></View>
      <Text style={{ width: 52, fontSize: font.label, fontWeight: '800', color: color.text, textAlign: 'right' }}>{v}</Text>
    </View>
  );
  return (
    <View style={{ gap: 16 }} accessible={false}>
      {weekly.map((x) => (
        <View key={x.end} style={{ gap: 6 }}>
          <Text style={{ fontSize: font.body, fontWeight: '700', color: color.text }}>Week ending {fmtDay(x.end)} ({x.n} {x.n === 1 ? 'reading' : 'readings'})</Text>
          <Bar v={x.sys} c={color.accent.red} tag="Top" />
          <Bar v={x.dia} c={color.accent.blue} tag="Bottom" />
        </View>
      ))}
    </View>
  );
}

// How many readings fall in each 10 mmHg range. Counts are printed next to each bar.
function SpreadView({ b, c, name }: { b: Bin[]; c: string; name: string }) {
  const color = useColors();
  const max = Math.max(...b.map((x) => x.count));
  return (
    <View style={{ gap: 8 }}>
      {b.map((x) => (
        <View key={x.from} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ width: 96, fontSize: font.body, color: color.text }}>{binLabel(x)}</Text>
          <View style={{ flex: 1, height: 28 }}>{x.count > 0 ? <View style={{ width: `${(x.count / max) * 100}%`, height: 28, borderRadius: 6, backgroundColor: c }} /> : null}</View>
          <Text style={{ width: 40, fontSize: font.label, fontWeight: '800', color: color.text, textAlign: 'right' }}>{x.count}</Text>
        </View>
      ))}
    </View>
  );
}

const arc = (cx: number, cy: number, r0: number, r1: number, a0: number, a1: number) => {
  const p = (r: number, a: number) => `${cx + r * Math.sin(a)} ${cy - r * Math.cos(a)}`;
  const big = a1 - a0 > Math.PI ? 1 : 0;
  return `M ${p(r1, a0)} A ${r1} ${r1} 0 ${big} 1 ${p(r1, a1)} L ${p(r0, a1)} A ${r0} ${r0} 0 ${big} 0 ${p(r0, a0)} Z`;
};

// Donut of the same ranges. Every slice is listed with its count and percent, so colour is never the only cue.
function ShareView({ b, total, name, accent }: { b: Bin[]; total: number; name: string; accent: 'red' | 'blue' }) {
  const color = useColors();
  const used = b.filter((x) => x.count > 0);
  const cols = ramp(color, used.length, accent);
  let acc = 0;
  const S = 200;
  return (
    <View style={{ gap: 16, alignItems: 'center' }}>
      <View accessible={false} importantForAccessibility="no-hide-descendants">
        <Svg width={S} height={S}>
          {used.length === 1 ? <Circle cx={S / 2} cy={S / 2} r={70} stroke={cols[0]} strokeWidth={60} fill="none" /> : used.map((x, i) => {
            const a0 = (acc / total) * 2 * Math.PI; acc += x.count; const a1 = (acc / total) * 2 * Math.PI;
            return <Path key={x.from} d={arc(S / 2, S / 2, 40, 100, a0, a1)} fill={cols[i]} stroke={color.surface} strokeWidth={2} />;
          })}
          <SvgText x={S / 2} y={S / 2 + 8} fontSize={24} fontWeight="800" fill={color.text} textAnchor="middle">{total}</SvgText>
        </Svg>
      </View>
      <View style={{ alignSelf: 'stretch', gap: 8 }}>
        {used.map((x, i) => (
          <View key={x.from} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Swatch c={cols[i]} />
            <Text style={{ flex: 1, fontSize: font.body, color: color.text }}>{name} {binLabel(x)}</Text>
            <Text style={{ fontSize: font.label, fontWeight: '800', color: color.text }}>{x.count} ({x.percent}%)</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

type View4 = 'line' | 'weekly' | 'spread' | 'share';

// Four views of the same readings, neutral numbers only: no target bands, no normal/high/low labels, no good or bad colours.
export function BpChart({ rows }: { rows: ChartRow[] }) {
  const color = useColors();
  const [view, setView] = useState<View4>('line');
  const [days, setDays] = useState<RangeDays>(30);
  const [which, setWhich] = useState<'systolic' | 'diastolic'>('systolic');
  const now = useMemo(() => Date.now(), [rows, days]);
  const data = useMemo(() => windowRows(rows, days, now), [rows, days, now]);
  const weekly = useMemo(() => weeklyAverages(data, days, now), [data, days, now]);
  const b = useMemo(() => bins(data, which), [data, which]);
  const label = which === 'systolic' ? 'Top' : 'Bottom';
  const text = view === 'line' ? summary(data, days) : view === 'weekly' ? weeklySummary(weekly, days) : spreadSummary(b, label, days);
  const accent = which === 'systolic' ? 'red' : 'blue';
  const full = which === 'systolic' ? 'Top number (SYS)' : 'Bottom number (DIA)';
  const needsToggle = view === 'spread' || view === 'share';

  return (
    <View style={{ gap: 12 }}>
      <Segmented label="Chart type" value={view} options={[{ value: 'line', label: 'Line' }, { value: 'weekly', label: 'Weekly' }, { value: 'spread', label: 'Spread' }, { value: 'share', label: 'Share' }]} onChange={setView} />
      <Segmented label="Time range" value={days} options={RANGES.map((d) => ({ value: d, label: `${d} days` }))} onChange={setDays} />
      {needsToggle ? <Segmented label="Which number" value={which} options={[{ value: 'systolic', label: 'Top (SYS)' }, { value: 'diastolic', label: 'Bottom (DIA)' }]} onChange={setWhich} /> : null}
      {needsToggle ? <Text accessibilityRole="header" style={{ fontSize: font.h2, fontWeight: '800', color: accent === 'red' ? color.accent.red : color.accent.blue }}>{full}</Text> : null}
      <Text accessibilityRole="text" accessibilityLabel={text} style={{ fontSize: font.body, color: color.text }}>{view === 'line' ? text : `Last ${days} days: ${data.length} ${data.length === 1 ? 'reading' : 'readings'}.`}</Text>
      {data.length < 2 ? <Body>Add at least 2 readings in this time range to see your chart.</Body>
        : view === 'line' ? <LineView data={data} days={days} now={now} />
        : view === 'weekly' ? <WeeklyView weekly={weekly} />
        : view === 'spread' ? <SpreadView b={b} c={accent === 'red' ? color.accent.red : color.accent.blue} name={label} />
        : <ShareView b={b} total={data.length} name={label} accent={accent} />}
      <Text style={{ fontSize: font.body, color: color.muted }}>These charts show your numbers only. Your doctor tells you which numbers are right for you.</Text>
    </View>
  );
}
