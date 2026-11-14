import { Redirect, Slot, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { AuthProvider, useAuth } from '@/lib/auth';

function Guard() {
  const { session, loading, needsMfa, recovery, touch } = useAuth();
  const path = usePathname();
  if (loading) return null;
  const isAuthRoute = path === '/sign-in' || path === '/sign-up' || path === '/reset-password';
  if (!session && !isAuthRoute) return <Redirect href="/sign-in" />;
  if (session && needsMfa && path !== '/mfa-verify') return <Redirect href="/mfa-verify" />;
  if (session && !needsMfa && recovery && path !== '/new-password') return <Redirect href="/new-password" />;
  if (session && !needsMfa && !recovery && isAuthRoute) return <Redirect href="/" />;
  return (
    <View style={{ flex: 1 }} onStartShouldSetResponderCapture={() => { touch(); return false; }}>
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
