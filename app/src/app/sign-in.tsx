import { useState } from 'react';
import { SocialButtons } from '@/components/SocialButtons';
import { Captcha, captchaEnabled, resetCaptcha } from '@/components/Captcha';
import { AuthScreen, BigButton, Body, Field, TextLink } from '@/components/ui';
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
    if (error) {
      const m = error.message || '';
      if (error.status === 429 || /rate limit/i.test(m)) setErr('Too many tries. Wait a few minutes, then try again.');
      else if (/email not confirmed/i.test(m)) setErr('Your email is not confirmed yet. Open the confirmation email first.');
      else if (error.status === 0 || /fetch|network/i.test(m)) setErr('Cannot reach the server. Check your internet connection.');
      else setErr('Sign-in failed. Check your email and password, then try again.');
      if (__DEV__) console.log('[signin]', error.status, m);
      setCaptchaToken(null); resetCaptcha();
    }
    setBusy(false);
  }

  return (
    <AuthScreen title="Sign in" disclaimer>
        {!isBackendConfigured && <Body tone="danger">Backend not configured. Set the Supabase variables in .env.local.</Body>}
        <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
        <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" />
        <Captcha onToken={setCaptchaToken} />
        {err ? <Body tone="danger">{err}</Body> : null}
        <BigButton label={busy ? 'Signing in...' : 'Sign in'} onPress={submit} disabled={busy || !email || !password || (captchaEnabled && !captchaToken)} />
        <SocialButtons verb="Sign in" />
        <TextLink href="/sign-up" label="New here? Create an account" />
        <TextLink href="/reset-password" label="Forgot your password?" />
    </AuthScreen>
  );
}
