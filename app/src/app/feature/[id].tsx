import { router, useLocalSearchParams } from 'expo-router';
import { BigButton, Body, DisclaimerFooter, H1, Screen } from '@/components/ui';

export default function Feature() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <Screen>
      <H1>{String(id).replace(/-/g, ' ')}</H1>
      <Body>This section is not built yet.</Body>
      <BigButton label="Back to my health" onPress={() => router.replace('/')} />
      <DisclaimerFooter />
    </Screen>
  );
}
