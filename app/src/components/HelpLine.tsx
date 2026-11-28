import { router } from 'expo-router';
import { BigButton, Body } from '@/components/ui';
import { useI18n } from '@/i18n/I18nProvider';

// For a very low or very high blood pressure or pulse: contact your doctor or local emergency services. Links to the emergency numbers card. No label, no official threshold.
export function HelpLine() {
  const { t } = useI18n();
  return (
    <>
      <Body tone="danger">{t('bp.helpLine')}</Body>
      <BigButton variant="secondary" label={t('today.emergencyTitle')} onPress={() => router.push('/feature/emergency')} />
    </>
  );
}
