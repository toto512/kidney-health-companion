import { Session } from '@supabase/supabase-js';
import { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { isExpired } from './inactivity';
import { mfaReady as isMfaReady, needsMfaCode } from './mfa';
import { isProfileComplete } from './profile';
import { isUnverifiedSocialUser } from './social';
import { wasOffered } from './twoStepOffer';
import { openedFromRecoveryLink, supabase } from './supabase';

type Aal = 'aal1' | 'aal2' | null;
type Ctx = { session: Session | null; loading: boolean; aal: Aal; needsMfa: boolean; profileComplete: boolean | null; refreshProfile: () => Promise<boolean | null>; offered: boolean | null; setOffered: (v: boolean) => void; recovery: boolean; clearRecovery: () => void; refreshAal: () => Promise<void>; touch: () => void };
const AuthCtx = createContext<Ctx>({ session: null, loading: true, aal: null, needsMfa: false, profileComplete: null, refreshProfile: async () => null, offered: null, setOffered: () => {}, recovery: false, clearRecovery: () => {}, refreshAal: async () => {}, touch: () => {} });
export const useAuth = () => useContext(AuthCtx);

const INACTIVITY_MINUTES = 15;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [aal, setAal] = useState<{ current: Aal; next: Aal }>({ current: null, next: null });
  const last = useRef(Date.now());
  const [recovery, setRecovery] = useState(openedFromRecoveryLink);
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
  // Whether the one-time two-step offer was already shown to this account on this device. null while unknown.
  const [offered, setOffered] = useState<boolean | null>(null);
  useEffect(() => {
    if (!session) { setOffered(null); return; }
    let alive = true;
    wasOffered(session.user.id).then((v) => { if (alive) setOffered(v); });
    return () => { alive = false; };
  }, [session?.user.id]);

  // Ready once the session is aal2, or when the user has no verified authenticator (two-step sign-in is optional).
  const mfaReady = isMfaReady(!!session, aal.current, aal.next);
  useEffect(() => {
    if (mfaReady) void refreshProfile(); else setProfileComplete(null);
  }, [session?.user.id, aal.current, aal.next]);

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
      if (data.session && isUnverifiedSocialUser(data.session.user)) {
        await supabase.auth.signOut({ scope: 'local' });
        setSession(null);
        setLoading(false);
        return;
      }
      setSession(data.session);
      if (data.session) await refreshAal();
      else setRecovery(false); // an expired or already-used reset link gives no session, so do not keep waiting on the new-password step
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, sess) => {
      if (event === 'PASSWORD_RECOVERY') setRecovery(true);
      if (sess && isUnverifiedSocialUser(sess.user)) { void supabase.auth.signOut({ scope: 'local' }); return; }
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

  // Two-step sign-in is optional: a code is needed only when the user has a verified authenticator (next level aal2)
  // and this session has not passed it yet. Until the level is known the user waits on the loading state.
  const needsMfa = needsMfaCode(!!session, aal.current, aal.next);
  return (
    <AuthCtx.Provider value={{ session, loading, aal: aal.current, needsMfa, profileComplete, refreshProfile, offered, setOffered, recovery, clearRecovery: () => setRecovery(false), refreshAal, touch: () => { last.current = Date.now(); } }}>
      {children}
    </AuthCtx.Provider>
  );
}
