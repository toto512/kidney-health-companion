import { Session } from '@supabase/supabase-js';
import { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { isExpired } from './inactivity';
import { isProfileComplete } from './profile';
import { supabase } from './supabase';

type Aal = 'aal1' | 'aal2' | null;
type Ctx = { session: Session | null; loading: boolean; aal: Aal; needsMfa: boolean; profileComplete: boolean | null; refreshProfile: () => Promise<boolean | null>; recovery: boolean; clearRecovery: () => void; refreshAal: () => Promise<void>; touch: () => void };
const AuthCtx = createContext<Ctx>({ session: null, loading: true, aal: null, needsMfa: false, profileComplete: null, refreshProfile: async () => null, recovery: false, clearRecovery: () => {}, refreshAal: async () => {}, touch: () => {} });
export const useAuth = () => useContext(AuthCtx);

const INACTIVITY_MINUTES = 15;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [aal, setAal] = useState<{ current: Aal; next: Aal }>({ current: null, next: null });
  const last = useRef(Date.now());
  const [recovery, setRecovery] = useState(false);
  const [profileComplete, setProfileComplete] = useState<boolean | null>(null);

  const refreshAal = async () => {
    const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    setAal({ current: (data?.currentLevel as Aal) ?? null, next: (data?.nextLevel as Aal) ?? null });
  };

  // null means unknown (not signed in yet, or the profile could not be read), which never forces a redirect.
  const refreshProfile = async () => {
    const { data, error } = await supabase.from('profiles').select('country_code,dob,sex_at_birth,height_cm,weight_kg').maybeSingle();
    const v = error ? null : isProfileComplete(data);
    setProfileComplete(v);
    return v;
  };
  useEffect(() => {
    if (session && aal.current === 'aal2') void refreshProfile(); else setProfileComplete(null);
  }, [session?.user.id, aal.current]);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) {
        // Server check: a deleted user or revoked session must not stay signed in locally.
        const { error } = await supabase.auth.getUser();
        if (error && (error.status === 401 || error.status === 403 || error.status === 404 || /user_not_found|jwt|session/i.test(`${(error as { code?: string }).code ?? ''} ${error.message}`))) {
          await supabase.auth.signOut({ scope: 'local' });
          setSession(null);
          setLoading(false);
          return;
        }
      }
      setSession(data.session);
      if (data.session) await refreshAal();
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, sess) => {
      if (event === 'PASSWORD_RECOVERY') setRecovery(true);
      setSession(sess);
      if (sess) void refreshAal();
      else setAal({ current: null, next: null });
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    const id = setInterval(() => {
      if (isExpired(last.current, Date.now(), INACTIVITY_MINUTES)) void supabase.auth.signOut();
    }, 30_000);
    return () => clearInterval(id);
  }, [session]);

  // Force TOTP enrolment too: a user with no verified factor is aal1/aal1 and must not skip MFA.
  const needsMfa = !!session && aal.current !== 'aal2';
  return (
    <AuthCtx.Provider value={{ session, loading, aal: aal.current, needsMfa, profileComplete, refreshProfile, recovery, clearRecovery: () => setRecovery(false), refreshAal, touch: () => { last.current = Date.now(); } }}>
      {children}
    </AuthCtx.Provider>
  );
}
