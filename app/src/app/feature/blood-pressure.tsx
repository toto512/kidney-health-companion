import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Select } from '@/components/Select';
import { BigButton, Body, DisclaimerFooter, H1, Screen } from '@/components/ui';
import { BP_LIMITS, parseReading } from '@/lib/bp';
import { supabase } from '@/lib/supabase';
import { color, font } from '@/theme/tokens';

// Whole numbers from the lowest to the highest value the app accepts (input limits only), nothing pre-selected.
const range = ({ min, max }: { min: number; max: number }) => Array.from({ length: max - min + 1 }, (_, i) => ({ value: String(min + i), label: String(min + i) }));

type Row = { id: string; systolic: number; diastolic: number; pulse: number | null; taken_at: string };

// Stores and lists readings only. No Low/Medium/High labels until a sourced reference range is supplied.
export default function BloodPressure() {
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
        <Body>Choose the numbers from your blood pressure monitor.</Body>
        <Select label="Top number (systolic)" value={sys} options={sysOptions} onChange={setSys} placeholder="Choose" searchLabel="Type a number" />
        <Select label="Bottom number (diastolic)" value={dia} options={diaOptions} onChange={setDia} placeholder="Choose" searchLabel="Type a number" />
        <Select label="Pulse (optional)" value={pulse} options={pulseOptions} onChange={setPulse} placeholder="Choose" searchLabel="Type a number" />
        {err ? <Body tone="danger">{err}</Body> : null}
        <BigButton label={busy ? 'Saving...' : 'Save reading'} onPress={save} disabled={busy || !sys || !dia} />
        <H1>My readings</H1>
        {rows.length === 0 ? <Body>No readings yet.</Body> : null}
        {rows.map((r) => (
          <View key={r.id} style={{ gap: 8, paddingVertical: 12, borderTopWidth: 1, borderColor: color.text }}>
            <Text style={{ fontSize: font.body, fontWeight: '700', color: color.text }}>
              {r.systolic} / {r.diastolic}{r.pulse != null ? `   pulse ${r.pulse}` : ''}
            </Text>
            <Body>{new Date(r.taken_at).toLocaleString()}</Body>
            <BigButton label="Delete this reading" onPress={() => remove(r.id)} />
          </View>
        ))}
        <Body>Show this list to your doctor, nurse, or pharmacist. They tell you which numbers are right for you.</Body>
        <BigButton label="Back to my health" onPress={() => router.replace('/')} />
        <DisclaimerFooter />
      </Screen>
    </ScrollView>
  );
}
