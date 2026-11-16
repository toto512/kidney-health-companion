import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Select } from '@/components/Select';
import { BigButton, Body, DisclaimerFooter, H1, Panel, Screen, SectionHeader } from '@/components/ui';
import { BpChart } from '@/components/BpChart';
import { BP_LIMITS, checkReading, parseReading } from '@/lib/bp';
import { supabase } from '@/lib/supabase';
import { font, useColors } from '@/theme/tokens';

// Whole numbers from the lowest to the highest value the app accepts (input limits only), nothing pre-selected.
const range = ({ min, max }: { min: number; max: number }) => Array.from({ length: max - min + 1 }, (_, i) => ({ value: String(min + i), label: String(min + i) }));

const SMALL = 140;

type Row = { id: string; systolic: number; diastolic: number; pulse: number | null; taken_at: string };

function SmallBtn({ label, onPress, danger }: { label: string; onPress: () => void; danger?: boolean }) {
  const color = useColors();
  const c = danger ? color.danger : color.primary;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label === 'Delete' ? 'Delete this reading' : label} onPress={onPress}
      style={{ minHeight: 44, minWidth: 44, paddingHorizontal: 12, borderRadius: 10, borderWidth: 2, borderColor: c, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: font.body, fontWeight: '700', color: c }}>{label}</Text>
    </Pressable>
  );
}

// Stores and lists readings only. No Low/Medium/High labels until a sourced reference range is supplied.
export default function BloodPressure() {
  const color = useColors();
  const [rows, setRows] = useState<Row[]>([]);
  const [sys, setSys] = useState('');
  const [dia, setDia] = useState('');
  const [pulse, setPulse] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState('');
  const [confirmDel, setConfirmDel] = useState('');

  const sysOptions = useMemo(() => range(BP_LIMITS.systolic), []);
  const diaOptions = useMemo(() => range(BP_LIMITS.diastolic), []);
  const pulseOptions = useMemo(() => range(BP_LIMITS.pulse), []);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('bp_readings').select('id,systolic,diastolic,pulse,taken_at').order('taken_at', { ascending: false }).limit(200);
    if (error) { setErr('Could not load your readings. Try again.'); return; }
    setRows(data ?? []);
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function save() {
    setErr('');
    const r = parseReading(sys, dia, pulse);
    if (!r.ok) { setErr(r.error); setConfirm(''); return; }
    // First press on an unusual pair shows the prompt; pressing again with the same numbers saves it.
    const warn = checkReading(r.value);
    const key = `${r.value.systolic}/${r.value.diastolic}`;
    if (warn && confirm !== key) { setConfirm(key); setErr(warn); return; }
    setConfirm('');
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from('bp_readings').insert({ user_id: u.user?.id, ...r.value });
    setBusy(false);
    if (error) { setErr('Could not save. Try again.'); return; }
    setSys(''); setDia(''); setPulse('');
    await load();
  }

  async function remove(id: string) {
    const { error } = await supabase.from('bp_readings').delete().eq('id', id);
    if (error) { setErr('Could not delete. Try again.'); return; }
    await load();
  }

  return (
    <ScrollView>
      <Screen>
        <H1>Blood pressure</H1>
        <Panel>
          <SectionHeader icon="❤️" accent="red">Add a reading</SectionHeader>
          <Body>Choose the numbers from your blood pressure monitor.</Body>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
            <Select label="Top (SYS)" value={sys} options={sysOptions} onChange={setSys} placeholder="--" searchLabel="Number" width={SMALL} valueSize={24} />
            <Text accessible={false} style={{ fontSize: 32, fontWeight: '700', color: color.text, marginTop: 34, lineHeight: 56 }}>/</Text>
            <Select label="Bottom (DIA)" value={dia} options={diaOptions} onChange={setDia} placeholder="--" searchLabel="Number" width={SMALL} valueSize={24} />
          </View>
          <Select label="Pulse (optional)" value={pulse} options={pulseOptions} onChange={setPulse} placeholder="--" searchLabel="Number" width={SMALL} valueSize={24} />
          {err ? <Body tone="danger">{err}</Body> : null}
          <BigButton label={busy ? 'Saving...' : 'Save reading'} onPress={save} disabled={busy || !sys || !dia} />
        </Panel>
        <Panel>
          <SectionHeader icon="📈" accent="red">My chart</SectionHeader>
          <BpChart rows={rows} />
        </Panel>
        <SectionHeader icon="📋" accent="red">My readings</SectionHeader>
        {rows.length === 0 ? <Body>No readings yet.</Body> : null}
        {rows.slice(0, 30).map((r) => (
          <View key={r.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 14, borderWidth: 1, borderColor: color.outline, backgroundColor: color.surface }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 30, lineHeight: 36, fontWeight: '800', color: color.accent.red }}>{r.systolic} / {r.diastolic}<Text style={{ fontSize: font.body, fontWeight: '600', color: color.muted }}> mmHg</Text></Text>
              <Text style={{ fontSize: font.body, color: color.muted }}>{r.pulse != null ? `Pulse ${r.pulse} · ` : ''}{new Date(r.taken_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</Text>
            </View>
            {confirmDel === r.id ? (
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <SmallBtn label="Yes, delete" danger onPress={() => { setConfirmDel(''); void remove(r.id); }} />
                <SmallBtn label="Keep" onPress={() => setConfirmDel('')} />
              </View>
            ) : <SmallBtn label="Delete" onPress={() => setConfirmDel(r.id)} />}
          </View>
        ))}
        <Body>Show this list to your doctor, nurse, or pharmacist. They tell you which numbers are right for you.</Body>
        <BigButton variant="secondary" label="Back to my health" onPress={() => router.replace('/')} />
        <DisclaimerFooter />
      </Screen>
    </ScrollView>
  );
}
