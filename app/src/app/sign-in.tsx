import { Link } from 'expo-router';
import { useState } from 'react';
import { ScrollView } from 'react-native';
import { BigButton, Body, DisclaimerFooter, Field, H1, Screen } from '@/components/ui';
import { isBackendConfigured, supabase } from '@/lib/supabase';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true); setErr('');
    // TODO(phase 2): pass options.captchaToken from the CAPTCHA widget once the provider is chosen.
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) setErr('Sign-in failed. Check your email and password, then try again.');
    setBusy(false);
  }

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <Screen>
        <H1>Sign in</H1>
        {!isBackendConfigured && <Body tone="danger">Backend not configured. Set the Supabase variables in .env.local.</Body>}
        <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
        <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" />
        {err ? <Body tone="danger">{err}</Body> : null}
        <BigButton label={busy ? 'Signing in...' : 'Sign in'} onPress={submit} disabled={busy || !email || !password} />
        <Link href="/sign-up"><Body>New here? Create an account</Body></Link>
        <DisclaimerFooter />
      </Screen>
    </ScrollView>
  );
}
