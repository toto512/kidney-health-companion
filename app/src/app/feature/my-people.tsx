import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { ContactRow } from '@/components/ContactRow';
import { Select } from '@/components/Select';
import { BigButton, Body, DisclaimerFooter, Field, H1, H2, Panel, Screen } from '@/components/ui';
import { canAddMore, displayPhone, MAX_CONTACTS, RELATIONSHIPS, Relationship, relationshipLabel, validateContact } from '@/lib/contactLogic';
import { addContact, Contact, deleteContact, deviceCopyOn, loadContacts, setDeviceCopy, updateContact } from '@/lib/emergencyContacts';
import { useAuth } from '@/lib/auth';
import { setFlash } from '@/lib/flash';
import { supabase } from '@/lib/supabase';
import { font, useColors } from '@/theme/tokens';

type Form = { id: string | null; name: string; relationship: string; phone: string };
const blank: Form = { id: null, name: '', relationship: '', phone: '' };

// Personal emergency contacts: up to 5, edit or replace any time. `first=1` is the step after the first profile save, with Skip.
export default function MyPeople() {
  const { first } = useLocalSearchParams<{ first?: string }>();
  const wizard = first === '1';
  const color = useColors();
  const { session } = useAuth();
  const uid = session?.user.id;
  const [list, setList] = useState<Contact[] | null>(null);
  const [country, setCountry] = useState<string | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [copyOn, setCopyOn] = useState(false);

  const reload = useCallback(async () => {
    const l = await loadContacts();
    if (!l) { setErr('Could not load your people. Try again.'); return; }
    setList(l);
    return l;
  }, []);
  useFocusEffect(useCallback(() => {
    void reload();
    supabase.from('profiles').select('country_code').maybeSingle().then(({ data }) => setCountry(data?.country_code ?? null));
    if (uid) void deviceCopyOn(uid).then(setCopyOn);
  }, [reload, uid]));

  async function save() {
    if (!form) return;
    setErr('');
    const r = validateContact(form, country);
    if (!r.ok) { setErr(r.error); return; }
    setBusy(true);
    let ok = false;
    if (form.id) ok = await updateContact(form.id, r.value);
    else {
      const res = await addContact(r.value);
      ok = res === 'ok';
      if (res === 'limit') { setBusy(false); setErr(`You can save up to ${MAX_CONTACTS} people. Remove one first.`); return; }
    }
    setBusy(false);
    if (!ok) { setErr('Could not save. Try again.'); return; }
    setForm(null);
    const l = await reload();
    if (uid && l && copyOn) await setDeviceCopy(uid, true, l);
  }
  async function remove(id: string) {
    setBusy(true);
    const ok = await deleteContact(id);
    setBusy(false); setConfirmDel(null);
    if (!ok) { setErr('Could not remove. Try again.'); return; }
    const l = await reload();
    if (uid && l && copyOn) await setDeviceCopy(uid, true, l);
  }
  async function toggleCopy(on: boolean) {
    if (!uid) return;
    setCopyOn(on);
    await setDeviceCopy(uid, on, list ?? []);
  }
  function done() {
    if (wizard) { setFlash('Profile saved.'); router.replace('/'); }
    else router.canGoBack() ? router.back() : router.replace('/');
  }

  return (
    <ScrollView keyboardShouldPersistTaps="handled">
      <Screen>
        <H1>My people</H1>
        <Body>Add the people to call first if something goes wrong, such as your doctor, a nurse, a family member or a friend. You can add up to {MAX_CONTACTS}. They show on Today with a Call button.</Body>
        <Body>This app does not call or alert anyone for you. For an emergency, call your local emergency number.</Body>
        {err ? <Text accessibilityRole="alert" style={{ color: color.danger, fontSize: font.body, fontWeight: '600' }}>{err}</Text> : null}
        {list === null && !err ? <Body>Loading.</Body> : null}

        {list?.map((c) => (
          <Panel key={c.id}>
            <ContactRow c={c} />
            {confirmDel === c.id ? (
              <>
                <Body tone="danger">Remove {c.name} from your list?</Body>
                <BigButton label="Yes, remove" disabled={busy} onPress={() => remove(c.id)} />
                <BigButton variant="secondary" label="Keep" onPress={() => setConfirmDel(null)} />
              </>
            ) : (
              <>
                <BigButton variant="secondary" label={`Change ${c.name}`} onPress={() => { setErr(''); setForm({ id: c.id, name: c.name, relationship: c.relationship, phone: c.phone }); }} />
                <BigButton variant="secondary" label={`Remove ${c.name}`} onPress={() => setConfirmDel(c.id)} />
              </>
            )}
          </Panel>
        ))}

        {form ? (
          <Panel>
            <H2>{form.id ? 'Change this person' : 'Add a person'}</H2>
            <Select label="Who are they to you? Scroll and choose" value={form.relationship as Relationship | ''} options={RELATIONSHIPS.map((r) => ({ value: r.value, label: r.label }))}
              onChange={(v) => { setForm({ ...form, relationship: v }); setErr(''); }} placeholder="Choose from the list" searchable={false} />
            {form.relationship ? (
              <>
                <Field label={`${relationshipLabel(form.relationship)}'s name`} value={form.name} onChangeText={(v) => { setForm({ ...form, name: v }); setErr(''); }} maxLength={60} autoCapitalize="words" />
              <Field label="Phone number" value={form.phone} onChangeText={(v) => { setForm({ ...form, phone: v }); setErr(''); }} keyboardType="phone-pad" autoComplete="off" maxLength={24} placeholder="For example 613 555 0123" />
                <BigButton label={busy ? 'Saving.' : 'Save'} disabled={busy} onPress={save} />
              </>
            ) : null}
            <BigButton variant="secondary" label="Cancel" onPress={() => { setForm(null); setErr(''); }} />
          </Panel>
        ) : null}

        {!form && list && canAddMore(list.length) ? <BigButton label={list.length ? 'Add another person' : 'Add a person'} onPress={() => { setErr(''); setForm({ ...blank }); }} /> : null}
        {list && !canAddMore(list.length) && !form ? <Body>You have {MAX_CONTACTS} people. Remove one to add someone new.</Body> : null}

        <Panel>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Text style={{ flex: 1, fontSize: font.label, fontWeight: '700', color: color.text }}>Keep a copy on this device</Text>
            <Switch accessibilityLabel="Keep a copy of my people on this device" value={copyOn} onValueChange={toggleCopy} />
          </View>
          <Body>Off by default. When on, these names and numbers can still show with no internet. Anyone who uses this device can then see them without signing in, so leave it off on a shared device. Turning it off deletes the copy.</Body>
        </Panel>

        {wizard ? (
          <>
            <BigButton label={list?.length ? 'Done' : 'Continue'} onPress={done} />
            {!list?.length ? <BigButton variant="secondary" label="Skip for now" onPress={done} /> : null}
          </>
        ) : <BigButton variant="secondary" label="Back" onPress={done} />}
        <DisclaimerFooter />
      </Screen>
    </ScrollView>
  );
}
