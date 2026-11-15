import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Select } from '@/components/Select';
import { BigButton, Body, DisclaimerFooter, H1, H2, Panel, Screen } from '@/components/ui';
import { BP_LIMITS, parseReading } from '@/lib/bp';
import { supabase } from '@/lib/supabase';
import { font, useColors } from '@/theme/tokens';

// Whole numbers from the lowest to the highest value the app accepts (input limits only), nothing pre-selected.
const range = ({ min, max }: { min: number; max: number }) => Array.from({ length: max - min + 1 }, (_, i) => ({ value: String(min + i), label: String(min + i) }));

const SMALL = 140;

type Row = { id: string; systolic: number; diastolic: number; pulse: number | null; taken_at: string };

// Stores and lists readings only. No Low/Medium/High labels until a sourced reference range is supplied.
export default function BloodPressure() {
  const color = useColors();
  const [rows, setRows] = useState<Row[]>([]);
  const [sys, setSys] = useState('');
  const [dia, setDia] = useState('');
  const [pulse, setPulse] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const sysOptions = useMemo(() => range(BP_LIMITS.systolic), []);
  const diaOptions = useMemo(() => range(BP_LIMITS.diastolic), []);
  const pulseOptions = useMemo(() => range(BP_LIMITS.pulse), []);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('bp_readings').select('id,systolic,diastolic,pulse,taken_at').order('taken_at', { ascending: false }).limit(60);
    if (error) { setErr('Could not load your readings. Try again.'); return; }
    setRows(data ?? []);
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function save() {
    setErr('');
    const r = parseReading(sys, dia, pulse);
    if (!r.ok) { setErr(r.error); return; }
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
          <H2>Add a reading</H2>
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
        <H2>My readings</H2>
        {rows.length === 0 ? <Body>No readings yet.</Body> : null}
        {rows.map((r) => (
          <Panel key={r.id}>
            <Text style={{ fontSize: 34, lineHeight: 42, fontWeight: '800', color: color.text }}>{r.systolic} / {r.diastolic}</Text>
            {r.pulse != null ? <Text style={{ fontSize: font.label, fontWeight: '600', color: color.text }}>Pulse {r.pulse}</Text> : null}
            <Text style={{ fontSize: font.body, color: color.muted }}>{new Date(r.taken_at).toLocaleString()}</Text>
            <BigButton variant="secondary" label="Delete this reading" onPress={() => remove(r.id)} />
          </Panel>
        ))}
        <Body>Show this list to your doctor, nurse, or pharmacist. They tell you which numbers are right for you.</Body>
        <BigButton variant="secondary" label="Back to my health" onPress={() => router.replace('/')} />
        <DisclaimerFooter />
      </Screen>
    </ScrollView>
  );
}
