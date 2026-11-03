// Bump VERSION on every release that changes a precached file.
const VERSION = 'v1';
const CACHE = 'mha-shell-' + VERSION;
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon.svg', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png',
  'js/app.js', 'js/data.js', 'js/meds.js', 'js/pwa.js', 'data/foods.json', 'guides/patient.html', 'guides/renal.html'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('mha-shell-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);
  // Same-origin GET only. Cross-origin (food Worker, Wikipedia) is never intercepted, so API data is never served from this cache.
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  // Network first so a new release is picked up when online; cached copy only when the network fails.
  e.respondWith(fetch(req).then(res => {
    if (res.ok && res.type === 'basic') {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(req, copy));
    }
    return res;
  }).catch(() => caches.match(req, { ignoreSearch: true }).then(hit => hit || (req.mode === 'navigate' ? caches.match('index.html') : Response.error()))));
});
