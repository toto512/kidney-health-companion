import { Redirect, Slot, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { AuthProvider, useAuth } from '@/lib/auth';
import { useColors } from '@/theme/tokens';

function Guard() {
  const color = useColors();
  const { session, loading, aal, needsMfa, profileComplete, offered, recovery, touch } = useAuth();
  const path = usePathname();
  if (loading || (session && aal === null)) return null;
  const isAuthRoute = path === '/sign-in' || path === '/sign-up' || path === '/reset-password';
  if (!session && !isAuthRoute) return <Redirect href="/sign-in" />;
  if (session && needsMfa && path !== '/mfa-verify' && path !== '/recover') return <Redirect href="/mfa-verify" />;
  if (session && !needsMfa && recovery && path !== '/new-password') return <Redirect href="/new-password" />;
  if (session && !needsMfa && !recovery && profileComplete === false && path !== '/feature/profile' && path !== '/feature/two-step' && path !== '/feature/recovery-codes' && path !== '/feature/emergency' && path !== '/feature/my-people') return <Redirect href="/feature/profile" />;
  if (session && !needsMfa && !recovery && profileComplete === true && offered === false && aal !== 'aal2' && path !== '/offer-two-step' && path !== '/feature/two-step' && path !== '/feature/recovery-codes' && path !== '/feature/my-people' && path !== '/feature/call-contact') return <Redirect href="/offer-two-step" />;
  if (session && !needsMfa && !recovery && (isAuthRoute || path === '/mfa-verify')) return <Redirect href="/" />;
  return (
    <View style={{ flex: 1, backgroundColor: color.bg }} onStartShouldSetResponderCapture={() => { touch(); return false; }}>
      <Slot />
    </View>
  );
}

export default function Root() {
  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <Guard />
    </AuthProvider>
  );
}
