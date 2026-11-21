import { router } from 'expo-router';
import { setFlash } from '@/lib/flash';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Select } from '@/components/Select';
import { BigButton, Body, DisclaimerFooter, Field, H1, Panel, Screen, SectionHeader, Segmented as UnitToggle } from '@/components/ui';
import { WORLD_COUNTRIES } from '@/content/countries';
import { useAuth } from '@/lib/auth';
import { countryLabel } from '@/i18n/labels';
import { sexLabel, stepLabel, trError } from '@/i18n/labels';
import { useI18n } from '@/i18n/I18nProvider';
import { cmToFeetInches, countryName, HeightUnit, isSupported, kgToLb, parseHeightCm, parseProfile, parseWeightKg, SEX_OPTIONS, WeightUnit } from '@/lib/profile';
import { font, useColors } from '@/theme/tokens';
import { supabase } from '@/lib/supabase';
import { useTextSize } from '@/lib/textSize';
import { TEXT_STEPS, TEXT_STEP_LABELS } from '@/theme/textSize';

const UNITS_KEY = 'profile.units';

// Country decides which approved medicine list and official sources the app will use later.
export default function Profile() {
  const { t, lang } = useI18n();
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
  const { step: textStep, setStep: setTextStep } = useTextSize();
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from('profiles').select('name,dob,sex_at_birth,height_cm,weight_kg,country_code').maybeSingle();
      if (error) { setErr(t('profile.errLoad')); return; }
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
    if (!r.ok) { setErr(trError(t, r.error)); return; }
    const wasNew = profileComplete === false;
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from('profiles').upsert({ user_id: u.user?.id, ...r.value });
    setBusy(false);
    if (error) { setErr(t('profile.errSave')); return; }
    setCmDb(r.value.height_cm); setKgDb(r.value.weight_kg);
    await refreshProfile();
    if (wasNew) { router.replace('/feature/my-people?first=1'); return; } // first login: next wizard step
    setFlash(t('profile.saved')); // the dashboard shows this for a few seconds so it is clear the save worked
    router.replace('/');
  }

  return (
    <ScrollView>
      <Screen>
        <H1>{t('profile.title')}</H1>
        {profileComplete === false ? <Body>{t('profile.fillAll')}</Body> : null}
        <Panel>
          <SectionHeader icon="👤" accent="blue">{t('profile.aboutYou')}</SectionHeader>
        <Select label={t('profile.country')} value={country} options={WORLD_COUNTRIES.map((c) => ({ value: c.code, label: countryLabel(c.code, lang, c.name) }))} onChange={edit(setCountry)} placeholder={t('profile.chooseCountry')} searchLabel={t('profile.typeCountry')} />
        {country && !isSupported(country) ? <Body>{t('profile.noContent', { country: countryLabel(country, lang, countryName(country)) })}</Body> : null}
        <Field label={t('profile.nameOpt')} value={name} onChangeText={edit(setName)} maxLength={80} />
        <Select label={t('profile.sex')} value={sex} options={SEX_OPTIONS.map((o) => ({ value: o.value, label: sexLabel(t, o.value, o.label) }))} onChange={edit(setSex)} placeholder={t('profile.choose')} searchable={false} />
        <Field label={t('profile.dob')} value={dob} onChangeText={edit(setDob)} placeholder="1950-03-27" maxLength={10} />
        </Panel>
        <Panel>
          <SectionHeader icon="📏" accent="teal">{t('profile.body')}</SectionHeader>
        <UnitToggle label={t('profile.heightUnit')} value={hUnit} options={[{ value: 'cm', label: 'cm' }, { value: 'ft', label: t('profile.feetInches') }]} onChange={(v) => { const cur = parseHeightCm(hUnit, height, heightFt, heightIn); if (cur !== null) setCmDb(cur); else { setHeight(''); setHeightFt(''); setHeightIn(''); } setHUnit(v); pickUnits(v, wUnit); }} />
        {hUnit === 'cm'
          ? <Field label={t('profile.heightCm')} value={height} onChangeText={edit(setHeight)} keyboardType="decimal-pad" maxLength={5} />
          : <>
              <Field label={t('profile.heightFeet')} value={heightFt} onChangeText={edit(setHeightFt)} keyboardType="number-pad" maxLength={1} />
              <Field label={t('profile.heightInches')} value={heightIn} onChangeText={edit(setHeightIn)} keyboardType="number-pad" maxLength={2} />
            </>}
        <UnitToggle label={t('profile.weightUnit')} value={wUnit} options={[{ value: 'kg', label: 'kg' }, { value: 'lb', label: 'lb' }]} onChange={(v) => { const cur = parseWeightKg(wUnit, weight); if (cur !== null) setKgDb(cur); else setWeight(''); setWUnit(v); pickUnits(hUnit, v); }} />
        <Field label={wUnit === 'kg' ? t('profile.weightKg') : t('profile.weightLb')} value={weight} onChangeText={edit(setWeight)} keyboardType="decimal-pad" maxLength={5} />
        </Panel>
        <Panel>
          <SectionHeader icon="🔠" accent="blue">{t('profile.textSize')}</SectionHeader>
          <Body>{t('profile.textSizeBody')}</Body>
          <UnitToggle label={t('profile.textSize')} value={textStep} options={TEXT_STEPS.map((s) => ({ value: s, label: stepLabel(t, s, TEXT_STEP_LABELS[s]) }))} onChange={setTextStep} />
        </Panel>
        {err ? <Body tone="danger">{err}</Body> : null}
        {msg ? <Body>{msg}</Body> : null}
        <BigButton label={busy ? t('profile.saving') : t('profile.save')} onPress={save} disabled={busy} />
        <BigButton variant="secondary" label={t('profile.myPeopleBtn')} onPress={() => router.push('/feature/my-people')} />
        <BigButton variant="secondary" label={t('me.twoStep')} onPress={() => router.push('/feature/two-step')} />
        <BigButton variant="secondary" label={t('profile.backHealth')} onPress={() => router.replace('/')} />
        <DisclaimerFooter />
      </Screen>
    </ScrollView>
  );
}
