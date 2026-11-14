import { Link } from 'expo-router';
import { useState } from 'react';
import { ScrollView } from 'react-native';
import { BigButton, Body, Field, H1, Screen } from '@/components/ui';
import { Captcha, captchaEnabled, resetCaptcha } from '@/components/Captcha';
import { supabase } from '@/lib/supabase';

// Step 1: email a reset message. Step 2: enter the 6-digit code from that email (never a password by email).
// The email template must contain {{ .Token }} for the code; the default template only has a link.
export default function ResetPassword() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  async function send() {
    setBusy(true); setMsg('');
    await supabase.auth.resetPasswordForEmail(email.trim(), { captchaToken: captchaToken ?? undefined });
    setCaptchaToken(null); resetCaptcha();
    // Same message whether or not the address exists, so the form cannot be used to find accounts.
    setSent(true); setMsg('If that email has an account, we sent a message with a 6-digit code.');
    setBusy(false);
  }

  async function verify() {
    setBusy(true); setMsg('');
    // On success a PASSWORD_RECOVERY session starts; the route guard then moves on to MFA and the new-password screen.
    const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'recovery' });
    if (error) setMsg('That code did not work. Check the newest email, or ask for a new one.');
    setBusy(false);
  }

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <Screen>
        <H1>Reset your password</H1>
        <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" editable={!sent} />
        {!sent && <Captcha onToken={setCaptchaToken} />}
        {sent && <Field label="6-digit code from the email" value={code} onChangeText={setCode} keyboardType="number-pad" maxLength={6} />}
        {msg ? <Body>{msg}</Body> : null}
        {!sent
          ? <BigButton label={busy ? 'Sending...' : 'Send code'} onPress={send} disabled={busy || !email || (captchaEnabled && !captchaToken)} />
          : <BigButton label="Continue" onPress={verify} disabled={busy || code.length !== 6} />}
        <Link href="/sign-in"><Body>Back to sign in</Body></Link>
      </Screen>
    </ScrollView>
  );
}
