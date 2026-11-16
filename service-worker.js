// Touches ONLY this app's caches (treattrack-v*), never the beta's
const CACHE = 'treattrack-v13';
const FILES = ['./', './index.html', './manifest.json', './icon-192-v13.png', './icon-512-v13.png',
  './fonts/ibm-plex-mono-latin-400-normal.woff2', './fonts/ibm-plex-mono-latin-500-normal.woff2',
  './fonts/ibm-plex-mono-latin-ext-400-normal.woff2', './fonts/ibm-plex-mono-latin-ext-500-normal.woff2',
  './fonts/space-grotesk-latin-500-normal.woff2', './fonts/space-grotesk-latin-700-normal.woff2'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k.startsWith('treattrack-v') && k !== CACHE).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

// Network-first: fresh files when online, cache fallback when offline
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Only keep good same-origin responses; an error page must never replace the cached app
        if (!res.ok) return caches.match(e.request).then(hit => hit || res);
        if (new URL(e.request.url).origin === location.origin) {
          const copy = res.clone();
          e.waitUntil(caches.open(CACHE).then(c => c.put(e.request, copy)));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
