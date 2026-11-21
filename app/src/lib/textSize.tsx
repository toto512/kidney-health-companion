import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, Fragment, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { isTextStep, TextStep } from '../theme/textSize';
import { setTextSize } from '../theme/tokens';

// The chosen text size is a device setting (not sensitive), kept in plain local storage.
const KEY = 'ui.textSize';
type Ctx = { step: TextStep; setStep: (s: TextStep) => void };
const TextSizeCtx = createContext<Ctx>({ step: 'normal', setStep: () => {} });
export const useTextSize = () => useContext(TextSizeCtx);

// Renders children only after the saved size is applied. Children are keyed by the size, so changing it redraws every screen.
export function TextSizeProvider({ children }: { children: ReactNode }) {
  const [step, setStepState] = useState<TextStep>('normal');
  const [ready, setReady] = useState(false);
  useEffect(() => {
    AsyncStorage.getItem(KEY).then((v) => { if (isTextStep(v)) { setTextSize(v); setStepState(v); } }).catch(() => {}).finally(() => setReady(true));
  }, []);
  const setStep = useCallback((s: TextStep) => {
    setTextSize(s); setStepState(s);
    AsyncStorage.setItem(KEY, s).catch(() => {});
  }, []);
  if (!ready) return null;
  return <TextSizeCtx.Provider value={{ step, setStep }}><Fragment key={step}>{children}</Fragment></TextSizeCtx.Provider>;
}
