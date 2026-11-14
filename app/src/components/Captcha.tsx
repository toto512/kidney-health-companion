import { useEffect } from 'react';
import { Platform, View } from 'react-native';
import { Body } from './ui';

export const CAPTCHA_SITEKEY = process.env.EXPO_PUBLIC_TURNSTILE_SITEKEY ?? '';
export const captchaEnabled = CAPTCHA_SITEKEY.length > 0;

declare global {
  interface Window {
    turnstile?: { render: (el: HTMLElement, o: Record<string, unknown>) => string; reset: (id?: string) => void };
  }
}

const SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
let widgetId: string | undefined;

/** Resets the widget after a failed or used attempt (tokens are single use). */
export function resetCaptcha() {
  if (Platform.OS === 'web' && window.turnstile) window.turnstile.reset(widgetId);
}

/**
 * Cloudflare Turnstile on web. Native (iOS/Android) needs a WebView host and is not built yet:
 * with CAPTCHA enabled server-side, native sign-in will fail until that is added (Phase 5).
 */
export function Captcha({ onToken }: { onToken: (t: string | null) => void }) {
  useEffect(() => {
    if (!captchaEnabled || Platform.OS !== 'web') return;
    const mount = () => {
      const el = document.getElementById('captcha-slot');
      if (!el || !window.turnstile || el.childElementCount > 0) return;
      widgetId = window.turnstile.render(el, {
        sitekey: CAPTCHA_SITEKEY,
        callback: (t: string) => onToken(t),
        'expired-callback': () => onToken(null),
        'error-callback': () => onToken(null),
      });
    };
    if (window.turnstile) { mount(); return; }
    const s = document.createElement('script');
    s.src = SCRIPT; s.async = true; s.onload = mount;
    document.head.appendChild(s);
  }, [onToken]);

  if (!captchaEnabled) return null;
  if (Platform.OS !== 'web') return <Body tone="danger">Human check is not available in the phone app yet.</Body>;
  return <View nativeID="captcha-slot" />;
}
