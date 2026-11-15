import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { Select } from '@/components/Select';
import { BigButton, Body, DisclaimerFooter, Field, H1, Screen } from '@/components/ui';
import { WORLD_COUNTRIES } from '@/content/countries';
import { EmergencyBanner } from '@/components/EmergencyBanner';
import { useAuth } from '@/lib/auth';
import { countryName, isSupported, parseProfile, SEX_OPTIONS } from '@/lib/profile';
import { supabase } from '@/lib/supabase';

// Country decides which approved medicine list and official sources the app will use later.
export default function Profile() {
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
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
        setHeight(data.height_cm != null ? String(data.height_cm) : ''); setWeight(data.weight_kg != null ? String(data.weight_kg) : '');
      }
    })();
  }, []);

  async function save() {
    setErr(''); setMsg('');
    const r = parseProfile({ name, dob, sex, height, weight, country }, new Date());
    if (!r.ok) { setErr(r.error); return; }
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from('profiles').upsert({ user_id: u.user?.id, ...r.value });
    setBusy(false);
    if (error) { setErr('Could not save. Try again.'); return; }
    const wasForced = profileComplete === false;
    const ok = await refreshProfile();
    setMsg('Saved.');
    if (wasForced && ok) router.replace('/');
  }

  return (
    <ScrollView>
      <Screen>
        <H1>My profile</H1>
        {profileComplete === false ? <Body>Please fill in every field except name. The app uses them for your age, sex and body measurements.</Body> : null}
        <EmergencyBanner />
        <Select label="Country" value={country} options={WORLD_COUNTRIES.map((c) => ({ value: c.code, label: c.name }))} onChange={setCountry} placeholder="Choose your country" searchLabel="Type a country name" />
        {country && !isSupported(country) ? <Body>Health information for {countryName(country)} is not available in this app yet. You can still save your profile and use blood pressure tracking.</Body> : null}
        <Field label="Name (optional)" value={name} onChangeText={setName} maxLength={80} />
        <Select label="Sex at birth" value={sex} options={SEX_OPTIONS} onChange={setSex} placeholder="Choose" searchable={false} />
        <Field label="Date of birth, year-month-day" value={dob} onChangeText={setDob} placeholder="1950-03-27" maxLength={10} />
        <Field label="Height in cm" value={height} onChangeText={setHeight} keyboardType="decimal-pad" maxLength={5} />
        <Field label="Weight in kg" value={weight} onChangeText={setWeight} keyboardType="decimal-pad" maxLength={5} />
        {err ? <Body tone="danger">{err}</Body> : null}
        {msg ? <Body>{msg}</Body> : null}
        <BigButton label={busy ? 'Saving...' : 'Save profile'} onPress={save} disabled={busy} />
        <BigButton label="Two-step sign-in" onPress={() => router.push('/feature/two-step')} />
        <BigButton label="Back to my health" onPress={() => router.replace('/')} />
        <DisclaimerFooter />
      </Screen>
    </ScrollView>
  );
}
