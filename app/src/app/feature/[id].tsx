import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { builtHref } from '@/lib/featureRoutes';
import { useI18n } from '@/i18n/I18nProvider';
import { BigButton, Body, DisclaimerFooter, H1, Screen } from '@/components/ui';

export default function Feature() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useI18n();
  const built = builtHref(String(id));
  if (built) return <Redirect href={built} />; // a section that now has its own screen
  return (
    <Screen>
      <H1>{String(id).replace(/-/g, ' ')}</H1>
      <Body>{t('placeholder.notBuilt')}</Body>
      <BigButton label={t('profile.backHealth')} onPress={() => router.replace('/')} />
      <DisclaimerFooter />
    </Screen>
  );
}
