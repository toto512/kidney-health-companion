import { router } from 'expo-router';
import { setFlash } from '@/lib/flash';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Select } from '@/components/Select';
import { BigButton, Body, DisclaimerFooter, Field, H1, Panel, Screen, SectionHeader } from '@/components/ui';
import { WORLD_COUNTRIES } from '@/content/countries';
import { useAuth } from '@/lib/auth';
import { cmToFeetInches, countryName, HeightUnit, isSupported, kgToLb, parseHeightCm, parseProfile, parseWeightKg, SEX_OPTIONS, WeightUnit } from '@/lib/profile';
import { font, useColors } from '@/theme/tokens';
import { supabase } from '@/lib/supabase';

const UNITS_KEY = 'profile.units';

function UnitToggle<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  const color = useColors();
  return (
    <View style={{ flexDirection: 'row', gap: 8 }} accessibilityRole="radiogroup" accessibilityLabel={label}>
      {options.map((o) => (
        <Pressable key={o.value} accessibilityRole="radio" accessibilityState={{ selected: value === o.value }} accessibilityLabel={o.label} onPress={() => onChange(o.value)}
          style={{ flex: 1, minHeight: 56, borderRadius: 12, borderWidth: 2, borderColor: color.primary, alignItems: 'center', justifyContent: 'center', backgroundColor: value === o.value ? color.primary : color.bg }}>
          <Text style={{ fontSize: font.label, fontWeight: '700', color: value === o.value ? color.primaryText : color.primary }}>{o.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

// Country decides which approved medicine list and official sources the app will use later.
export default function Profile() {
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [height, setHeight] = useState('');
  const [heightFt, setHeightFt] = useState('');
  const [heightIn, setHeightIn] = useState('');
  const [weight, setWeight] = useState('');
  const [hUnit, setHUnit] = useState<HeightUnit>('cm');
  const [wUnit, setWUnit] = useState<WeightUnit>('kg');
  const [cmDb, setCmDb] = useState<number | null>(null);
  const [kgDb, setKgDb] = useState<number | null>(null);
  const [country, setCountry] = useState('');
  const [sex, setSex] = useState('');
  const { profileComplete, refreshProfile } = useAuth();
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from('profiles').select('name,dob,sex_at_birth,height_cm,weight_kg,country_code').maybeSingle();
      if (error) { setErr('Could not load your profile. Try again.'); return; }
      if (data) {
        setName(data.name ?? ''); setDob(data.dob ?? ''); setCountry(data.country_code ?? ''); setSex(data.sex_at_birth ?? '');
        setCmDb(data.height_cm != null ? Number(data.height_cm) : null); setKgDb(data.weight_kg != null ? Number(data.weight_kg) : null);
      }
    })();
  }, []);

  // Remembered unit choice. Not sensitive, so plain local storage is fine.
  useEffect(() => {
    AsyncStorage.getItem(UNITS_KEY).then((v) => {
      try {
        const u = v ? JSON.parse(v) : null;
        if (u?.h === 'ft' || u?.h === 'cm') setHUnit(u.h);
        if (u?.w === 'lb' || u?.w === 'kg') setWUnit(u.w);
      } catch { /* ignore a bad stored value */ }
    }).catch(() => {});
  }, []);

  // Show the stored canonical values in the chosen units whenever the unit or the loaded value changes.
  useEffect(() => {
    if (cmDb == null) return;
    if (hUnit === 'cm') setHeight(String(cmDb));
    else { const f = cmToFeetInches(cmDb); setHeightFt(String(f.ft)); setHeightIn(String(f.inch)); }
  }, [hUnit, cmDb]);
  useEffect(() => {
    if (kgDb == null) return;
    setWeight(String(wUnit === 'kg' ? kgDb : kgToLb(kgDb)));
  }, [wUnit, kgDb]);

  function pickUnits(h: HeightUnit, w: WeightUnit) {
    setErr(''); setMsg('');
    AsyncStorage.setItem(UNITS_KEY, JSON.stringify({ h, w })).catch(() => {});
  }
  // Clears a stale message as soon as the person edits anything.
  const edit = <T,>(set: (v: T) => void) => (v: T) => { set(v); setErr(''); setMsg(''); };

  async function save() {
    setErr(''); setMsg('');
    const r = parseProfile({ name, dob, sex, height, heightFt, heightIn, heightUnit: hUnit, weight, weightUnit: wUnit, country }, new Date());
    if (!r.ok) { setErr(r.error); return; }
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from('profiles').upsert({ user_id: u.user?.id, ...r.value });
    setBusy(false);
    if (error) { setErr('Could not save. Try again.'); return; }
    setCmDb(r.value.height_cm); setKgDb(r.value.weight_kg);
    await refreshProfile();
    setFlash('Profile saved.'); // the dashboard shows this for a few seconds so it is clear the save worked
    router.replace('/');
  }

  return (
    <ScrollView>
      <Screen>
        <H1>My profile</H1>
        {profileComplete === false ? <Body>Please fill in every field except name. The app uses them for your age, sex and body measurements.</Body> : null}
        <Panel>
          <SectionHeader icon="👤" accent="blue">About you</SectionHeader>
        <Select label="Country" value={country} options={WORLD_COUNTRIES.map((c) => ({ value: c.code, label: c.name }))} onChange={edit(setCountry)} placeholder="Choose your country" searchLabel="Type a country name" />
        {country && !isSupported(country) ? <Body>Health information for {countryName(country)} is not available in this app yet. You can still save your profile and use blood pressure tracking.</Body> : null}
        <Field label="Name (optional)" value={name} onChangeText={edit(setName)} maxLength={80} />
        <Select label="Sex at birth" value={sex} options={SEX_OPTIONS} onChange={edit(setSex)} placeholder="Choose" searchable={false} />
        <Field label="Date of birth, year-month-day" value={dob} onChangeText={edit(setDob)} placeholder="1950-03-27" maxLength={10} />
        </Panel>
        <Panel>
          <SectionHeader icon="📏" accent="teal">Body measurements</SectionHeader>
        <UnitToggle label="Height unit" value={hUnit} options={[{ value: 'cm', label: 'cm' }, { value: 'ft', label: 'feet and inches' }]} onChange={(v) => { const cur = parseHeightCm(hUnit, height, heightFt, heightIn); if (cur !== null) setCmDb(cur); else { setHeight(''); setHeightFt(''); setHeightIn(''); } setHUnit(v); pickUnits(v, wUnit); }} />
        {hUnit === 'cm'
          ? <Field label="Height in cm" value={height} onChangeText={edit(setHeight)} keyboardType="decimal-pad" maxLength={5} />
          : <>
              <Field label="Height, feet" value={heightFt} onChangeText={edit(setHeightFt)} keyboardType="number-pad" maxLength={1} />
              <Field label="Height, inches" value={heightIn} onChangeText={edit(setHeightIn)} keyboardType="number-pad" maxLength={2} />
            </>}
        <UnitToggle label="Weight unit" value={wUnit} options={[{ value: 'kg', label: 'kg' }, { value: 'lb', label: 'lb' }]} onChange={(v) => { const cur = parseWeightKg(wUnit, weight); if (cur !== null) setKgDb(cur); else setWeight(''); setWUnit(v); pickUnits(hUnit, v); }} />
        <Field label={wUnit === 'kg' ? 'Weight in kg' : 'Weight in lb'} value={weight} onChangeText={edit(setWeight)} keyboardType="decimal-pad" maxLength={5} />
        </Panel>
        {err ? <Body tone="danger">{err}</Body> : null}
        {msg ? <Body>{msg}</Body> : null}
        <BigButton label={busy ? 'Saving...' : 'Save profile'} onPress={save} disabled={busy} />
        <BigButton variant="secondary" label="Two-step sign-in" onPress={() => router.push('/feature/two-step')} />
        <BigButton variant="secondary" label="Back to my health" onPress={() => router.replace('/')} />
        <DisclaimerFooter />
      </Screen>
    </ScrollView>
  );
}
