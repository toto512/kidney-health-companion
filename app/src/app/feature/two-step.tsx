import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Image, Linking, Pressable, ScrollView } from 'react-native';
import { BigButton, Body, DisclaimerFooter, Field, H1, Screen } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/i18n/I18nProvider';
import { normalizeSvgDataUri } from '@/lib/qr';
import { supabase } from '@/lib/supabase';

type F = { id: string; friendly_name?: string | null; created_at: string };

// Turn two-step sign-in on or off and manage authenticator apps. Two-step sign-in is optional.
export default function TwoStep() {
  const { refreshAal } = useAuth();
  const { t, date } = useI18n();
  const fname = (f: F) => (f.friendly_name ?? t('ts.defaultName')).replace(/\s\d{10,}$/, '');
  const [factors, setFactors] = useState<F[]>([]);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmId, setConfirmId] = useState('');
  const [adding, setAdding] = useState<{ id: string; qr: string; secret: string; uri: string } | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');

  const load = useCallback(async () => {
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error || !data) { setErr(t('ts.errRead')); return; }
    setFactors(data.totp as F[]);
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function startAdd() {
    setErr(''); setMsg(''); setBusy(true);
    const { data: list } = await supabase.auth.mfa.listFactors();
    for (const f of (list?.all ?? []).filter((x) => x.status === 'unverified')) await supabase.auth.mfa.unenroll({ factorId: f.id });
    const label = name.trim() || `Authenticator ${new Date().toISOString().slice(0, 10)}`;
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: `${label} ${Date.now()}` });
    setBusy(false);
    if (error || !data) { setErr(t('ts.errStart')); return; }
    setAdding({ id: data.id, qr: normalizeSvgDataUri(data.totp.qr_code), secret: data.totp.secret, uri: data.totp.uri });
  }

  async function confirmAdd() {
    if (!adding) return;
    setErr(''); setBusy(true);
    const ch = await supabase.auth.mfa.challenge({ factorId: adding.id });
    if (ch.error || !ch.data) { setBusy(false); setErr(t('ts.errCheck')); return; }
    const v = await supabase.auth.mfa.verify({ factorId: adding.id, challengeId: ch.data.id, code: code.trim() });
    setBusy(false);
    if (v.error) { setErr(t('ts.errBad')); return; }
    const first = factors.length === 0;
    setAdding(null); setCode(''); setName(''); setMsg(first ? t('ts.msgOn') : t('ts.msgAdded'));
    await load();
    await refreshAal();
    if (first) router.replace('/feature/recovery-codes'); // make recovery codes right away, before a phone is ever lost
  }

  async function remove(id: string) {
    setErr(''); setMsg('');
    if (confirmId !== id) { setConfirmId(id); return; }
    setBusy(true);
    const { error } = await supabase.auth.mfa.unenroll({ factorId: id });
    setBusy(false); setConfirmId('');
    if (error) { setErr(t('ts.errRemove')); return; }
    setMsg(factors.length <= 1 ? t('ts.msgOff') : t('ts.msgRemoved'));
    await load();
    await refreshAal();
  }

  return (
    <ScrollView>
      <Screen>
        <H1>{t('ts.title')}</H1>
        <Body>{factors.length === 0 ? t('ts.off') : t('ts.on')}</Body>
        {factors.map((f) => (
          <Body key={f.id}>
            {t('ts.added', { name: fname(f), date: date(f.created_at) })}
          </Body>
        ))}
        {factors.map((f) => (
          <BigButton key={`rm-${f.id}`} label={confirmId === f.id ? t('ts.tapAgain') : (factors.length <= 1 ? t('ts.turnOff') : t('ts.removeName', { name: fname(f) }))} onPress={() => remove(f.id)} disabled={busy} />
        ))}
        {adding ? (
          <>
            <Body>{t('ts.scan')}</Body>
            <Image accessibilityLabel={t('mfa.qrAlt')} source={{ uri: adding.qr }} style={{ width: 220, height: 220 }} />
            <Pressable accessibilityRole="link" onPress={() => Linking.openURL(adding.uri)}>
              <Body>{t('mfa.openApp')}</Body>
            </Pressable>
            <Body>{t('mfa.typeKey', { key: adding.secret.match(/.{1,4}/g)?.join(' ') ?? '' })}</Body>
            <Field label={t('mfa.code')} value={code} onChangeText={setCode} keyboardType="number-pad" maxLength={6} />
            <BigButton label={busy ? t('mfa.checking') : t('ts.confirmNew')} onPress={confirmAdd} disabled={busy || code.length !== 6} />
            <BigButton variant="secondary" label={t('people.cancel')} onPress={() => { setAdding(null); setCode(''); }} disabled={busy} />
          </>
        ) : (
          <>
            <Field label={t('ts.nameLabel')} value={name} onChangeText={setName} maxLength={30} />
            <BigButton label={busy ? t('ts.starting') : factors.length === 0 ? t('ts.turnOn') : t('ts.addAnother')} onPress={startAdd} disabled={busy} />
          </>
        )}
        {err ? <Body tone="danger">{err}</Body> : null}
        {msg ? <Body>{msg}</Body> : null}
        {factors.length > 0 ? <BigButton variant="secondary" label={t('ts.recovery')} onPress={() => router.replace('/feature/recovery-codes')} /> : null}
        <BigButton variant="secondary" label={t('ts.backProfile')} onPress={() => router.replace('/feature/profile')} />
        <DisclaimerFooter />
      </Screen>
    </ScrollView>
  );
}
