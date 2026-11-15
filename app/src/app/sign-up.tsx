import { useState } from 'react';
import { SocialButtons } from '@/components/SocialButtons';
import { Captcha, captchaEnabled, currentCaptchaToken, resetCaptcha } from '@/components/Captcha';
import { AuthScreen, BigButton, Body, Field, TextLink } from '@/components/ui';
import { siteUrl } from '@/lib/siteUrl';
import { supabase } from '@/lib/supabase';

// One question per screen is the target design; this first version collects only the minimum (email, password).
export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  async function submit() {
    setBusy(true); setMsg('');
    const { error } = await supabase.auth.signUp({ email: email.trim(), password, options: { captchaToken: currentCaptchaToken(captchaToken), emailRedirectTo: siteUrl() } });
    setCaptchaToken(null); resetCaptcha();
    setMsg(error ? 'Could not create the account. Try a longer password or a different email.' : 'Check your email to confirm your account, then sign in.');
    setBusy(false);
  }

  return (
    <AuthScreen title="Create your account" disclaimer>
        <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
        <Field label="Password (at least 12 characters)" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" />
        <Captcha onToken={setCaptchaToken} />
        {msg ? <Body>{msg}</Body> : null}
        <BigButton label={busy ? 'Creating...' : 'Create account'} onPress={submit} disabled={busy || !email || password.length < 12 || (captchaEnabled && !captchaToken)} />
        <SocialButtons verb="Sign up" />
        <TextLink href="/sign-in" label="Already have an account? Sign in" />
    </AuthScreen>
  );
}
