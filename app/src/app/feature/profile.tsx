import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { BigButton, Body, DisclaimerFooter, Field, H1, Screen } from '@/components/ui';
import { COUNTRIES, Country, parseProfile } from '@/lib/profile';
import { supabase } from '@/lib/supabase';
import { color, font, MIN_TOUCH } from '@/theme/tokens';

// Country decides which approved medicine list and official sources the app will use later.
export default function Profile() {
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [country, setCountry] = useState<Country | ''>('');
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from('profiles').select('name,dob,height_cm,weight_kg,country_code').maybeSingle();
      if (error) { setErr('Could not load your profile. Try again.'); return; }
      if (data) {
        setName(data.name ?? ''); setDob(data.dob ?? ''); setCountry((data.country_code as Country) ?? '');
        setHeight(data.height_cm != null ? String(data.height_cm) : ''); setWeight(data.weight_kg != null ? String(data.weight_kg) : '');
      }
    })();
  }, []);

  async function save() {
    setErr(''); setMsg('');
    const r = parseProfile({ name, dob, height, weight, country }, new Date());
    if (!r.ok) { setErr(r.error); return; }
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from('profiles').upsert({ user_id: u.user?.id, ...r.value });
    setBusy(false);
    if (error) { setErr('Could not save. Try again.'); return; }
    setMsg('Saved.');
  }

  return (
    <ScrollView>
      <Screen>
        <H1>My profile</H1>
        <Text style={{ fontSize: font.label, fontWeight: '600', color: color.text }}>Country</Text>
        <View style={{ gap: 12 }}>
          {COUNTRIES.map((c) => (
            <Pressable key={c.code} accessibilityRole="radio" accessibilityState={{ selected: country === c.code }} onPress={() => setCountry(c.code)}
              style={{ minHeight: MIN_TOUCH, justifyContent: 'center', paddingHorizontal: 16, borderRadius: 12, borderWidth: 3, borderColor: color.text, backgroundColor: country === c.code ? color.text : 'transparent' }}>
              <Text style={{ fontSize: font.body, fontWeight: '700', color: country === c.code ? '#FFFFFF' : color.text }}>{c.label}</Text>
            </Pressable>
          ))}
        </View>
        <Field label="Name (optional)" value={name} onChangeText={setName} maxLength={80} />
        <Field label="Date of birth, year-month-day (optional)" value={dob} onChangeText={setDob} placeholder="1950-03-27" maxLength={10} />
        <Field label="Height in cm (optional)" value={height} onChangeText={setHeight} keyboardType="decimal-pad" maxLength={5} />
        <Field label="Weight in kg (optional)" value={weight} onChangeText={setWeight} keyboardType="decimal-pad" maxLength={5} />
        {err ? <Body tone="danger">{err}</Body> : null}
        {msg ? <Body>{msg}</Body> : null}
        <BigButton label={busy ? 'Saving...' : 'Save profile'} onPress={save} disabled={busy} />
        <BigButton label="Back to my health" onPress={() => router.replace('/')} />
        <DisclaimerFooter />
      </Screen>
    </ScrollView>
  );
}
