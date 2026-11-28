import { router } from 'expo-router';
import { Body, BigButton, AuthScreen } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/i18n/I18nProvider';
import { markOffered } from '@/lib/twoStepOffer';

// Shown once after a new account's profile is complete. Skippable. Two-step sign-in can be turned on later in My profile.
export default function OfferTwoStep() {
  const { session, setOffered } = useAuth();
  const { t } = useI18n();
  async function done(next: '/feature/two-step' | '/') {
    if (session) await markOffered(session.user.id);
    setOffered(true);
    router.replace(next);
  }
  return (
    <AuthScreen title={t('today.extraProtection')}>
      <Body>{t('offer.body1')}</Body>
      <Body>{t('offer.body2')}</Body>
      <BigButton label={t('today.twoStepTitle')} onPress={() => done('/feature/two-step')} />
      <BigButton label={t('offer.notNow')} variant="secondary" onPress={() => done('/')} />
    </AuthScreen>
  );
}
