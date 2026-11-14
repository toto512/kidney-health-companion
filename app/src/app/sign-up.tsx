import { Link } from 'expo-router';
import { useState } from 'react';
import { ScrollView } from 'react-native';
import { BigButton, Body, DisclaimerFooter, Field, H1, Screen } from '@/components/ui';
import { supabase } from '@/lib/supabase';

// One question per screen is the target design; this first version collects only the minimum (email, password).
export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true); setMsg('');
    // TODO(phase 2): pass options.captchaToken from the CAPTCHA widget once the provider is chosen.
    const { error } = await supabase.auth.signUp({ email: email.trim(), password });
    setMsg(error ? 'Could not create the account. Try a longer password or a different email.' : 'Check your email to confirm your account, then sign in.');
    setBusy(false);
  }

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <Screen>
        <H1>Create your account</H1>
        <Body>This app gives information only. It is not medical advice. Talk to your doctor, nurse, or pharmacist about your health.</Body>
        <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
        <Field label="Password (at least 12 characters)" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" />
        {msg ? <Body>{msg}</Body> : null}
        <BigButton label={busy ? 'Creating...' : 'Create account'} onPress={submit} disabled={busy || !email || password.length < 12} />
        <Link href="/sign-in"><Body>Already have an account? Sign in</Body></Link>
      </Screen>
    </ScrollView>
  );
}
