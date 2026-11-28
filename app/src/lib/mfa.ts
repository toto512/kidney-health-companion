// Two-step sign-in is optional. `next` is aal2 only when the user has a verified authenticator.
export type Aal = 'aal1' | 'aal2' | null;

// A code is needed only when the user has an authenticator and this session has not passed it yet.
export const needsMfaCode = (hasSession: boolean, current: Aal, next: Aal) =>
  hasSession && current !== null && current !== 'aal2' && next === 'aal2';

// The session may use user data: it passed two-step, or the user has no authenticator (so password-only is allowed).
export const mfaReady = (hasSession: boolean, current: Aal, next: Aal) =>
  hasSession && current !== null && (current === 'aal2' || next !== 'aal2');
