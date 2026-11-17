import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { ScrollView, type ScrollViewInstance, View } from 'react-native';
import { BigButton, Body, DisclaimerFooter, H1, Panel, Screen, Tile } from '@/components/ui';
import { useI18n } from '@/i18n/I18nProvider';
import type { Key } from '@/i18n/strings/en';
import { deleteMyAccount, type DeleteError } from '@/lib/deleteAccount';
import { supabase } from '@/lib/supabase';

const DELETE_ERR: Record<DeleteError, Key> = { failed: 'acct.errFailed', twostep: 'acct.errTwoStep', notSetUp: 'acct.errNotSetUp', signin: 'lab.errSignedOut' };

export default function Me() {
  const { t } = useI18n();
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const scroll = useRef<ScrollViewInstance>(null);

  async function remove() {
    setErr(''); setBusy(true);
    const r = await deleteMyAccount();
    setBusy(false);
    if (!r.ok) { setErr(t(DELETE_ERR[r.error])); setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 80); }
  }

  return (
    <ScrollView ref={scroll}>
      <Screen>
        <H1>{t('me.title')}</H1>
        <View style={{ gap: 12 }}>
          <Tile label={t('me.myProfile')} icon="👤" onPress={() => router.push('/feature/profile')} />
          <Tile label={t('me.conditions')} icon="📋" onPress={() => router.push('/feature/choose-conditions')} />
          <Tile label={t('me.medicines')} icon="💊" onPress={() => router.push('/feature/choose-medicines')} />
          <Tile label={t('me.twoStep')} icon="🔐" onPress={() => router.push('/feature/two-step')} />
          <Tile label={t('me.language')} icon="🌐" onPress={() => router.push('/feature/language')} />
          <Tile label={t('me.settings')} icon="⚙️" onPress={() => router.push({ pathname: '/feature/[id]', params: { id: 'settings' } })} />
        </View>
        <BigButton variant="secondary" label={t('me.signOut')} onPress={() => supabase.auth.signOut()} />
        {asking ? (
          <Panel tone="danger">
            <Body tone="danger">{t('acct.ask')}</Body>
            {err ? <Body tone="danger">{err}</Body> : null}
            <BigButton label={busy ? t('acct.deleting') : t('acct.yes')} onPress={() => void remove()} disabled={busy} />
            <BigButton variant="secondary" label={t('people.keep')} onPress={() => { setAsking(false); setErr(''); }} disabled={busy} />
          </Panel>
        ) : <BigButton variant="secondary" label={t('acct.delete')} onPress={() => { setAsking(true); setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 80); }} />}
        <DisclaimerFooter />
        <View style={{ height: 130 }} />
      </Screen>
    </ScrollView>
  );
}
