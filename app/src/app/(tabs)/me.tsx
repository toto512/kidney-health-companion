import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { BigButton, DisclaimerFooter, H1, Screen, Tile } from '@/components/ui';
import { useI18n } from '@/i18n/I18nProvider';
import { supabase } from '@/lib/supabase';

export default function Me() {
  const { t } = useI18n();
  return (
    <ScrollView>
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
        <DisclaimerFooter />
        <View style={{ height: 110 }} />
      </Screen>
    </ScrollView>
  );
}
