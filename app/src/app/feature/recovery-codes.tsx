import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { BigButton, Body, DisclaimerFooter, H1, Screen } from '@/components/ui';
import { useI18n } from '@/i18n/I18nProvider';
import { generateError } from '@/lib/recovery';
import { supabase } from '@/lib/supabase';
import { font, space, useColors } from '@/theme/tokens';

// Recovery codes for two-step sign-in. New codes are shown once, here, and never again.
export default function RecoveryCodes() {
  const color = useColors();
  const { t } = useI18n();
  const [remaining, setRemaining] = useState<number | null>(null);
  const [codes, setCodes] = useState<string[] | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [twoStepOn, setTwoStepOn] = useState<boolean | null>(null);

  const load = useCallback(async () => {
    const { data: f } = await supabase.auth.mfa.listFactors();
    setTwoStepOn(f ? (f.totp ?? []).length > 0 : null);
    const { data, error } = await supabase.rpc('recovery_codes_remaining');
    if (error && __DEV__) console.log('[recovery-codes] remaining:', error.code, error.message);
    if (!error && typeof data === 'number') setRemaining(data);
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function make() {
    if (remaining && remaining > 0 && !confirm) { setConfirm(true); return; }
    setErr(''); setBusy(true); setConfirm(false);
    const { data, error } = await supabase.rpc('generate_recovery_codes');
    setBusy(false);
    if (error || !Array.isArray(data)) {
      if (__DEV__ && error) console.log('[recovery-codes] generate:', error.code, error.message); // paste this line when reporting a problem
      const k = generateError(error);
      setErr(k === 'missing' ? t('rc.errMissing')
        : k === 'off' ? t('rc.errOff')
        : k === 'aal2' ? t('rc.errAal2')
        : k === 'signedOut' ? t('rc.errSignedOut')
        : t('rc.errGeneric'));
      return;
    }
    setCodes(data as string[]);
    setRemaining((data as string[]).length);
  }

  return (
    <ScrollView>
      <Screen>
        <H1>{t('rc.title')}</H1>
        {codes ? (
          <>
            <Body tone="danger">{t('rc.writeDown')}</Body>
            <View style={{ backgroundColor: color.surface, borderColor: color.border, borderWidth: 1, borderRadius: 16, padding: space.m }}>
              {codes.map((c) => <Text key={c} selectable style={{ fontSize: font.h2, color: color.text, letterSpacing: 2, paddingVertical: 4 }}>{c}</Text>)}
            </View>
            <Body>{t('rc.warn')}</Body>
            <BigButton label={t('rc.saved')} onPress={() => { setCodes(null); void load(); }} />
          </>
        ) : (
          <>
            <Body>{t('rc.intro')}</Body>
            {twoStepOn === false ? (
              <>
                <Body>{t('rc.needTwoStep')}</Body>
                <BigButton label={t('rc.goTwoStep')} onPress={() => router.replace('/feature/two-step')} />
              </>
            ) : null}
            <Body>{remaining === null ? '' : remaining > 0 ? t('rc.remaining', { n: remaining }) : t('rc.none')}</Body>
            {confirm ? <Body tone="danger">{t('rc.newCancels')}</Body> : null}
            {twoStepOn !== false ? <BigButton label={busy ? t('rc.making') : remaining ? t('rc.makeNew') : t('rc.make')} onPress={make} disabled={busy || twoStepOn === null} /> : null}
            {err ? <Body tone="danger">{err}</Body> : null}
            <BigButton variant="secondary" label={t('rc.backTwoStep')} onPress={() => router.replace('/feature/two-step')} />
          </>
        )}
        <DisclaimerFooter />
      </Screen>
    </ScrollView>
  );
}
