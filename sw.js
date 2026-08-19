/* eIFUCompass service worker.
   Install/offline without ever serving stale regulatory content to
   an online user:
   - Page navigations -> NETWORK-FIRST (online visitors always get the latest
     published build; cache is the offline fallback). This matters for a
     regulatory tool where content must not go stale silently.
   - Static assets (css/js/data/icons/manifest) -> CACHE-FIRST.
   - External links (primary-source citations) are never intercepted.
   Bump CACHE when the asset list changes. */
const CACHE = 'eifucompass-v1';
const ASSETS = [
  './',
  'index.html',
  'css/styles.css',
  'js/reference.js',
  'js/rules-eifu.js',
  'js/checklist-engine.js',
  'js/export.js',
  'js/app.js',
  'data/eu-languages.json',
  'manifest.webmanifest',
  'icon.svg',
  'pwa-icon.svg',
  'pwa-icon-192.png',
  'pwa-icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // let external citations pass

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('index.html', copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match('index.html').then((r) => r || caches.match('./')))
    );
    return;
  }
  // Cache-first, with runtime caching so bundled assets (e.g. the symbol SVGs
  // in assets/symbols/) become available offline after first load.
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
      return res;
    }))
  );
});
