import { router } from 'expo-router';
import { useState } from 'react';
import { AuthScreen, BigButton, Body, Field } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/i18n/I18nProvider';
import { supabase } from '@/lib/supabase';

export default function NewPassword() {
  const { clearRecovery } = useAuth();
  const { t } = useI18n();
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true); setMsg('');
    const { error } = await supabase.auth.updateUser({ password });
    if (error) { setMsg(t('newpw.err')); setBusy(false); return; }
    clearRecovery();
    router.replace('/');
  }

  return (
    <AuthScreen title={t('newpw.title')}>
        <Field label={t('newpw.label')} value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" />
        {msg ? <Body tone="danger">{msg}</Body> : null}
        <BigButton label={busy ? t('profile.saving') : t('newpw.save')} onPress={save} disabled={busy || password.length < 12} />
    </AuthScreen>
  );
}
