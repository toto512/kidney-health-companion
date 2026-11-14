import { Link } from 'expo-router';
import { useState } from 'react';
import { ScrollView } from 'react-native';
import { Captcha, captchaEnabled, resetCaptcha } from '@/components/Captcha';
import { BigButton, Body, DisclaimerFooter, Field, H1, Screen } from '@/components/ui';
import { isBackendConfigured, supabase } from '@/lib/supabase';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  async function submit() {
    setBusy(true); setErr('');
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password, options: { captchaToken: captchaToken ?? undefined } });
    if (error) { setErr('Sign-in failed. Check your email and password, then try again.'); setCaptchaToken(null); resetCaptcha(); }
    setBusy(false);
  }

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <Screen>
        <H1>Sign in</H1>
        {!isBackendConfigured && <Body tone="danger">Backend not configured. Set the Supabase variables in .env.local.</Body>}
        <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
        <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" />
        <Captcha onToken={setCaptchaToken} />
        {err ? <Body tone="danger">{err}</Body> : null}
        <BigButton label={busy ? 'Signing in...' : 'Sign in'} onPress={submit} disabled={busy || !email || !password || (captchaEnabled && !captchaToken)} />
        <Link href="/sign-up"><Body>New here? Create an account</Body></Link>
        <Link href="/reset-password"><Body>Forgot your password?</Body></Link>
        <DisclaimerFooter />
      </Screen>
    </ScrollView>
  );
}
