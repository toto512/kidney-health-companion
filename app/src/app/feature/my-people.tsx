import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { ContactRow } from '@/components/ContactRow';
import { Select } from '@/components/Select';
import { BigButton, Body, DisclaimerFooter, Field, H1, H2, Panel, Screen } from '@/components/ui';
import { canAddMore, displayPhone, MAX_CONTACTS, RELATIONSHIPS, Relationship, relationshipLabel, validateContact } from '@/lib/contactLogic';
import { addContact, Contact, deleteContact, deviceCopyOn, loadContacts, setDeviceCopy, updateContact } from '@/lib/emergencyContacts';
import { useAuth } from '@/lib/auth';
import { relLabel, trError } from '@/i18n/labels';
import { useI18n } from '@/i18n/I18nProvider';
import { supabase } from '@/lib/supabase';
import { font, useColors } from '@/theme/tokens';

type Form = { id: string | null; name: string; relationship: string; phone: string };
const blank: Form = { id: null, name: '', relationship: '', phone: '' };

// Personal emergency contacts: up to 5, edit or replace any time. `first=1` is the step after the first profile save, with Skip.
export default function MyPeople() {
  const { t } = useI18n();
  const rel = (v: string) => relLabel(t, v, relationshipLabel(v));
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
    if (!l) { setErr(t('people.errLoad')); return; }
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
    if (!r.ok) { setErr(trError(t, r.error)); return; }
    setBusy(true);
    let ok = false;
    if (form.id) ok = await updateContact(form.id, r.value);
    else {
      const res = await addContact(r.value);
      ok = res === 'ok';
      if (res === 'limit') { setBusy(false); setErr(t('people.errLimit', { max: MAX_CONTACTS })); return; }
    }
    setBusy(false);
    if (!ok) { setErr(t('profile.errSave')); return; }
    setForm(null);
    const l = await reload();
    if (uid && l && copyOn) await setDeviceCopy(uid, true, l);
  }
  async function remove(id: string) {
    setBusy(true);
    const ok = await deleteContact(id);
    setBusy(false); setConfirmDel(null);
    if (!ok) { setErr(t('people.errRemove')); return; }
    const l = await reload();
    if (uid && l && copyOn) await setDeviceCopy(uid, true, l);
  }
  async function toggleCopy(on: boolean) {
    if (!uid) return;
    setCopyOn(on);
    await setDeviceCopy(uid, on, list ?? []);
  }
  function done() {
    if (wizard) router.replace('/feature/calendar-app?first=1'); // next optional wizard step; it shows the saved message
    else router.canGoBack() ? router.back() : router.replace('/');
  }

  return (
    <ScrollView keyboardShouldPersistTaps="handled">
      <Screen>
        <H1>{t('people.title')}</H1>
        <Body>{t('people.intro', { max: MAX_CONTACTS })}</Body>
        <Body>{t('people.noAlert')}</Body>
        {err ? <Text accessibilityRole="alert" style={{ color: color.danger, fontSize: font.body, fontWeight: '600' }}>{err}</Text> : null}
        {list === null && !err ? <Body>{t('emergency.loading')}</Body> : null}

        {list?.map((c) => (
          <Panel key={c.id}>
            <ContactRow c={c} />
            {confirmDel === c.id ? (
              <>
                <Body tone="danger">{t('people.removeAsk', { name: c.name })}</Body>
                <BigButton label={t('people.yesRemove')} disabled={busy} onPress={() => remove(c.id)} />
                <BigButton variant="secondary" label={t('people.keep')} onPress={() => setConfirmDel(null)} />
              </>
            ) : (
              <>
                <BigButton variant="secondary" label={t('people.change', { name: c.name })} onPress={() => { setErr(''); setForm({ id: c.id, name: c.name, relationship: c.relationship, phone: c.phone }); }} />
                <BigButton variant="secondary" label={t('people.remove', { name: c.name })} onPress={() => setConfirmDel(c.id)} />
              </>
            )}
          </Panel>
        ))}

        {form ? (
          <Panel>
            <H2>{form.id ? t('people.changeThis') : t('people.addPerson')}</H2>
            <Select label={t('people.who')} value={form.relationship as Relationship | ''} options={RELATIONSHIPS.map((r) => ({ value: r.value, label: rel(r.value) }))}
              onChange={(v) => { setForm({ ...form, relationship: v }); setErr(''); }} placeholder={t('people.chooseList')} searchable={false} />
            {form.relationship ? (
              <>
                <Field label={t('people.nameOf', { role: rel(form.relationship) })} value={form.name} onChangeText={(v) => { setForm({ ...form, name: v }); setErr(''); }} maxLength={60} autoCapitalize="words" />
              <Field label={t('people.phone')} value={form.phone} onChangeText={(v) => { setForm({ ...form, phone: v }); setErr(''); }} keyboardType="phone-pad" autoComplete="off" maxLength={24} placeholder={t('people.phoneEx')} />
                <BigButton label={busy ? t('people.saving') : t('people.save')} disabled={busy} onPress={save} />
              </>
            ) : null}
            <BigButton variant="secondary" label={t('people.cancel')} onPress={() => { setForm(null); setErr(''); }} />
          </Panel>
        ) : null}

        {!form && list && canAddMore(list.length) ? <BigButton label={list.length ? t('people.addAnother') : t('people.addPerson')} onPress={() => { setErr(''); setForm({ ...blank }); }} /> : null}
        {list && !canAddMore(list.length) && !form ? <Body>{t('people.full', { max: MAX_CONTACTS })}</Body> : null}

        <Panel>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Text style={{ flex: 1, fontSize: font.label, fontWeight: '700', color: color.text }}>{t('people.copyTitle')}</Text>
            <Switch accessibilityLabel={t('people.copyA11y')} value={copyOn} onValueChange={toggleCopy} />
          </View>
          <Body>{t('people.copyBody')}</Body>
        </Panel>

        {wizard ? (
          <>
            <BigButton label={list?.length ? t('people.done') : t('people.continue')} onPress={done} />
            {!list?.length ? <BigButton variant="secondary" label={t('people.skip')} onPress={done} /> : null}
          </>
        ) : <BigButton variant="secondary" label={t('people.back')} onPress={done} />}
        <DisclaimerFooter />
      </Screen>
    </ScrollView>
  );
}
