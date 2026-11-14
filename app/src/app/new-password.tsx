import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView } from 'react-native';
import { BigButton, Body, Field, H1, Screen } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export default function NewPassword() {
  const { clearRecovery } = useAuth();
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true); setMsg('');
    const { error } = await supabase.auth.updateUser({ password });
    if (error) { setMsg('Could not save the new password. Try a different one (at least 12 characters).'); setBusy(false); return; }
    clearRecovery();
    router.replace('/');
  }

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <Screen>
        <H1>Choose a new password</H1>
        <Field label="New password (at least 12 characters)" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" />
        {msg ? <Body tone="danger">{msg}</Body> : null}
        <BigButton label={busy ? 'Saving...' : 'Save password'} onPress={save} disabled={busy || password.length < 12} />
      </Screen>
    </ScrollView>
  );
}
