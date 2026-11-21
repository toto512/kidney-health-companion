import { useEffect } from 'react';
import { Platform, View } from 'react-native';
import { Body } from './ui';

export const CAPTCHA_SITEKEY = process.env.EXPO_PUBLIC_TURNSTILE_SITEKEY ?? '';
export const captchaEnabled = CAPTCHA_SITEKEY.length > 0;

declare global {
  interface Window {
    turnstile?: { render: (el: HTMLElement, o: Record<string, unknown>) => string; reset: (id?: string) => void; remove: (id?: string) => void; getResponse: (id?: string) => string | undefined };
  }
}

const SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
let widgetId: string | undefined;

/** Resets the widget after a failed or used attempt (tokens are single use). */
export function resetCaptcha() {
  if (Platform.OS === 'web' && window.turnstile) window.turnstile.reset(widgetId);
}

/**
 * The token the widget holds right now. Read at submit time so a stale copy in React state is never sent.
 * Falls back to the given value (the state copy) if the widget reports none.
 */
export function currentCaptchaToken(fallback: string | null): string | undefined {
  const t = (Platform.OS === 'web' && window.turnstile ? window.turnstile.getResponse(widgetId) : undefined) || fallback || undefined;
  if (__DEV__) {
    // Length and a short checksum only, never the token. A different checksum per attempt proves a fresh token each time.
    let h = 5381;
    for (const ch of t ?? '') h = ((h << 5) + h + ch.charCodeAt(0)) >>> 0;
    console.log(`[captcha] sending token: length=${t ? t.length : 0}, checksum=${t ? h.toString(16) : 'none'}, widget=${widgetId ?? 'none'}, sitekey=${CAPTCHA_SITEKEY.slice(0, 6)}`);
  }
  return t;
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
      if (__DEV__) console.log(`[captcha] rendering widget with site key starting "${CAPTCHA_SITEKEY.slice(0, 6)}" (1x0000 = Cloudflare test key, 0x4AAA = real key)`);
      widgetId = window.turnstile.render(el, {
        sitekey: CAPTCHA_SITEKEY,
        callback: (t: string) => onToken(t),
        'expired-callback': () => onToken(null),
        'error-callback': () => onToken(null),
      });
    };
    // One script tag only; a second mount before it loads waits on the same tag.
    let tag = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT}"]`);
    if (window.turnstile) mount();
    else if (tag) tag.addEventListener('load', mount);
    else {
      tag = document.createElement('script');
      tag.src = SCRIPT; tag.async = true; tag.onload = mount;
      document.head.appendChild(tag);
    }
    // Remove the widget when the screen goes away so an old widget never leaves a stale token behind.
    return () => {
      tag?.removeEventListener('load', mount);
      if (window.turnstile && widgetId) { try { window.turnstile.remove(widgetId); } catch { /* already gone */ } }
      widgetId = undefined;
      onToken(null);
    };
  }, [onToken]);

  if (!captchaEnabled) return null;
  if (Platform.OS !== 'web') return <Body tone="danger">Human check is not available in the phone app yet.</Body>;
  return <View nativeID="captcha-slot" />;
}
