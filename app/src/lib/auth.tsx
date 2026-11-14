import { Session } from '@supabase/supabase-js';
import { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { isExpired } from './inactivity';
import { supabase } from './supabase';

type Aal = 'aal1' | 'aal2' | null;
type Ctx = { session: Session | null; loading: boolean; aal: Aal; needsMfa: boolean; refreshAal: () => Promise<void>; touch: () => void };
const AuthCtx = createContext<Ctx>({ session: null, loading: true, aal: null, needsMfa: false, refreshAal: async () => {}, touch: () => {} });
export const useAuth = () => useContext(AuthCtx);

const INACTIVITY_MINUTES = 15;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [aal, setAal] = useState<{ current: Aal; next: Aal }>({ current: null, next: null });
  const last = useRef(Date.now());

  const refreshAal = async () => {
    const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    setAal({ current: (data?.currentLevel as Aal) ?? null, next: (data?.nextLevel as Aal) ?? null });
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session) await refreshAal();
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, sess) => {
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

  const needsMfa = !!session && aal.next === 'aal2' && aal.current !== 'aal2';
  return (
    <AuthCtx.Provider value={{ session, loading, aal: aal.current, needsMfa, refreshAal, touch: () => { last.current = Date.now(); } }}>
      {children}
    </AuthCtx.Provider>
  );
}
