if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
const sel = '[role=tab]';
const tabs = l => [...l.querySelectorAll(sel)];
const sync = l => { const t = tabs(l); const cur = t.find(x => x.getAttribute('aria-selected') === 'true') || t[0]; t.forEach(x => { x.tabIndex = x === cur ? 0 : -1; }); };
document.querySelectorAll('[role=tablist]').forEach(sync);
document.addEventListener('click', e => { const l = e.target.closest && e.target.closest('[role=tablist]'); if (l) sync(l); });
document.addEventListener('keydown', e => {
  const t = e.target.closest && e.target.closest(sel);
  if (!t) return;
  const a = tabs(t.closest('[role=tablist]')), i = a.indexOf(t);
  let n;
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = a[(i + 1) % a.length];
  else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = a[(i - 1 + a.length) % a.length];
  else if (e.key === 'Home') n = a[0];
  else if (e.key === 'End') n = a[a.length - 1];
  else return;
  e.preventDefault(); n.focus(); n.click();
});
