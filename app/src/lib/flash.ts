// One short message handed from the screen that finished an action to the screen the person lands on.
// Read once: the dashboard takes it and shows it for a few seconds.
let pending: string | null = null;
export const setFlash = (m: string) => { pending = m; };
export const takeFlash = () => { const m = pending; pending = null; return m; };
