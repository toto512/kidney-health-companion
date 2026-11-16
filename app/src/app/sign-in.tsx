import { useState } from 'react';
import { SocialButtons } from '@/components/SocialButtons';
import { Captcha, captchaEnabled, currentCaptchaToken, resetCaptcha } from '@/components/Captcha';
import { AuthScreen, BigButton, Body, Field, TextLink } from '@/components/ui';
import { useI18n } from '@/i18n/I18nProvider';
import { isBackendConfigured, supabase } from '@/lib/supabase';

export default function SignIn() {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  async function submit() {
    setBusy(true); setErr('');
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password, options: { captchaToken: currentCaptchaToken(captchaToken) } });
    if (error) {
      const m = error.message || '';
      if (error.status === 429 || /rate limit/i.test(m)) setErr(t('auth.errTooMany'));
      else if (/email not confirmed/i.test(m)) setErr(t('auth.errNotConfirmed'));
      else if (error.status === 0 || /fetch|network/i.test(m)) setErr(t('auth.errNetwork'));
      else setErr(t('auth.errFailed'));
      if (__DEV__) console.log('[signin]', error.status, m);
      setCaptchaToken(null); resetCaptcha();
    }
    setBusy(false);
  }

  return (
    <AuthScreen title={t('auth.signIn')} disclaimer>
        {!isBackendConfigured && <Body tone="danger">Backend not configured. Set the Supabase variables in .env.local.</Body>}
        <Field label={t('auth.email')} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
        <Field label={t('auth.password')} value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" />
        <Captcha onToken={setCaptchaToken} />
        {err ? <Body tone="danger">{err}</Body> : null}
        <BigButton label={busy ? t('auth.signingIn') : t('auth.signIn')} onPress={submit} disabled={busy || !email || !password || (captchaEnabled && !captchaToken)} />
        <SocialButtons verb="Sign in" />
        <TextLink href="/sign-up" label={t('auth.newHere')} />
        <TextLink href="/reset-password" label={t('auth.forgot')} />
    </AuthScreen>
  );
}
