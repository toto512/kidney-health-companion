import { router } from 'expo-router';
import { Body, BigButton, AuthScreen } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { markOffered } from '@/lib/twoStepOffer';

// Shown once after a new account's profile is complete. Skippable. Two-step sign-in can be turned on later in My profile.
export default function OfferTwoStep() {
  const { session, setOffered } = useAuth();
  async function done(next: '/feature/two-step' | '/') {
    if (session) await markOffered(session.user.id);
    setOffered(true);
    router.replace(next);
  }
  return (
    <AuthScreen title="Extra protection">
      <Body>You can add a second step when you sign in. After your password, the app asks for a short code from an app on your phone. It keeps your health information safer if someone learns your password.</Body>
      <Body>This is your choice. You can skip it and sign in with only your email and password. You can turn it on or off later in My profile.</Body>
      <BigButton label="Turn on two-step sign-in" onPress={() => done('/feature/two-step')} />
      <BigButton label="Not now" variant="secondary" onPress={() => done('/')} />
    </AuthScreen>
  );
}
