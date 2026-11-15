import { Redirect, Slot, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { AuthProvider, useAuth } from '@/lib/auth';
import { color } from '@/theme/tokens';

function Guard() {
  const { session, loading, needsMfa, profileComplete, recovery, touch } = useAuth();
  const path = usePathname();
  if (loading) return null;
  const isAuthRoute = path === '/sign-in' || path === '/sign-up' || path === '/reset-password';
  if (!session && !isAuthRoute) return <Redirect href="/sign-in" />;
  if (session && needsMfa && path !== '/mfa-verify') return <Redirect href="/mfa-verify" />;
  if (session && !needsMfa && recovery && path !== '/new-password') return <Redirect href="/new-password" />;
  if (session && !needsMfa && !recovery && profileComplete === false && path !== '/feature/profile' && path !== '/feature/two-step' && path !== '/feature/emergency') return <Redirect href="/feature/profile" />;
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
      <StatusBar style="dark" />
      <Guard />
    </AuthProvider>
  );
}
