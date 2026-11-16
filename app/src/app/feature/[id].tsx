import { router, useLocalSearchParams } from 'expo-router';
import { useI18n } from '@/i18n/I18nProvider';
import { BigButton, Body, DisclaimerFooter, H1, Screen } from '@/components/ui';

export default function Feature() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useI18n();
  return (
    <Screen>
      <H1>{String(id).replace(/-/g, ' ')}</H1>
      <Body>{t('placeholder.notBuilt')}</Body>
      <BigButton label={t('profile.backHealth')} onPress={() => router.replace('/')} />
      <DisclaimerFooter />
    </Screen>
  );
}
