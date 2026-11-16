import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import { createContext, Fragment, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { I18nManager, Platform } from 'react-native';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { DEFAULT_LANG, formatDate, isLang, isRtl, Lang, resolveLanguage, translate } from './core';
import type { Key } from './strings/en';
import { DICTS } from './strings';

// The language choice is not sensitive. It is kept on the device, and also on the account (profiles.language) so it follows the person.
const KEY = 'ui.language';
type Vars = Record<string, string | number>;
type Ctx = { lang: Lang; rtl: boolean; t: (key: Key, vars?: Vars) => string; date: (d: string | number | Date) => string; setLang: (l: Lang) => Promise<void> };
const I18nCtx = createContext<Ctx>({ lang: DEFAULT_LANG, rtl: false, t: (k) => k, date: (d) => String(d), setLang: async () => {} });
export const useI18n = () => useContext(I18nCtx);

const deviceTags = (): string[] => {
  try { return getLocales().map((l) => l.languageTag); } catch { return typeof navigator !== 'undefined' && navigator.languages ? [...navigator.languages] : []; }
};

// Web flips the whole page direction at once. On phones the layout direction is applied by the OS at the next app start [Inference: React Native reads I18nManager at launch].
function applyDirection(l: Lang) {
  const rtl = isRtl(l);
  if (Platform.OS === 'web') {
    if (typeof document !== 'undefined') { document.documentElement.lang = l; document.documentElement.dir = rtl ? 'rtl' : 'ltr'; }
  } else if (I18nManager.isRTL !== rtl) {
    I18nManager.allowRTL(rtl);
    I18nManager.forceRTL(rtl);
  }
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const uid = session?.user.id;
  const [lang, setLangState] = useState<Lang>(DEFAULT_LANG);
  const [ready, setReady] = useState(false);

  const apply = useCallback((l: Lang) => { applyDirection(l); setLangState(l); }, []);

  useEffect(() => {
    AsyncStorage.getItem(KEY).catch(() => null).then((saved) => apply(resolveLanguage(saved, deviceTags()))).finally(() => setReady(true));
  }, [apply]);

  // The account choice, if there is one, wins over this device. Before migration 0011 the column is missing: the error is ignored.
  useEffect(() => {
    if (!uid) return;
    let alive = true;
    supabase.from('profiles').select('language').maybeSingle().then(({ data }) => {
      const l = data?.language;
      if (alive && isLang(l)) { apply(l); AsyncStorage.setItem(KEY, l).catch(() => {}); }
    });
    return () => { alive = false; };
  }, [uid, apply]);

  const setLang = useCallback(async (l: Lang) => {
    apply(l);
    AsyncStorage.setItem(KEY, l).catch(() => {});
    if (uid) await supabase.from('profiles').upsert({ user_id: uid, language: l });
  }, [apply, uid]);

  const value = useMemo<Ctx>(() => ({
    lang, rtl: isRtl(lang), setLang,
    t: (key, vars) => translate(DICTS, lang, key, vars),
    date: (d) => formatDate(d, lang),
  }), [lang, setLang]);

  if (!ready) return null;
  // Keyed by language so every screen redraws when it changes.
  return <I18nCtx.Provider value={value}><Fragment key={lang}>{children}</Fragment></I18nCtx.Provider>;
}
