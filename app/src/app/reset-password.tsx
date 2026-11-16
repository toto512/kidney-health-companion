import { useState } from 'react';
import { AuthScreen, BigButton, Body, Field, TextLink } from '@/components/ui';
import { Captcha, captchaEnabled, currentCaptchaToken, resetCaptcha } from '@/components/Captcha';
import { useI18n } from '@/i18n/I18nProvider';
import { siteUrl } from '@/lib/siteUrl';
import { supabase } from '@/lib/supabase';

// Step 1: email a reset message. Step 2: enter the 6-digit code from that email (never a password by email).
// The email template must contain {{ .Token }} for the code; the default template only has a link.
export default function ResetPassword() {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  async function send() {
    setBusy(true); setMsg('');
    await supabase.auth.resetPasswordForEmail(email.trim(), {
      captchaToken: currentCaptchaToken(captchaToken),
      // Link flow (works with Supabase's default template): the link returns here and starts a recovery session.
      redirectTo: siteUrl(),
    });
    setCaptchaToken(null); resetCaptcha();
    // Same message whether or not the address exists, so the form cannot be used to find accounts.
    setSent(true); setMsg(t('reset.sent'));
    setBusy(false);
  }

  async function verify() {
    setBusy(true); setMsg('');
    // On success a PASSWORD_RECOVERY session starts; the route guard then moves on to MFA and the new-password screen.
    const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'recovery' });
    if (error) setMsg(t('reset.badCode'));
    setBusy(false);
  }

  return (
    <AuthScreen title={t('reset.title')}>
        <Field label={t('auth.email')} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" editable={!sent} />
        {!sent && <Captcha onToken={setCaptchaToken} />}
        {sent && <Field label={t('reset.code')} value={code} onChangeText={setCode} keyboardType="number-pad" maxLength={6} />}
        {msg ? <Body>{msg}</Body> : null}
        {!sent
          ? <BigButton label={busy ? t('reset.sending') : t('reset.send')} onPress={send} disabled={busy || !email || (captchaEnabled && !captchaToken)} />
          : <BigButton label={t('people.continue')} onPress={verify} disabled={busy || code.length !== 6} />}
        <TextLink href="/sign-in" label={t('reset.back')} />
    </AuthScreen>
  );
}
