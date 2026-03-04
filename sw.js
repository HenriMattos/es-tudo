// ─── SERVICE WORKER ──────────────────────────────────────────────────────────
// Estratégia: cache-first para assets estáticos, network-first para dados.

const CACHE_NAME = 'estudotudo-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/config.js',
  '/js/auth.js',
  '/js/db.js',
  '/js/ui.js',
  '/js/app.js',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap',
];

// ── Install: cache static assets ────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

// ── Activate: clean old caches ───────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch: cache-first for static, network-first for API ─────────────────────
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Skip Firebase / Google APIs — always network
  if (url.hostname.includes('googleapis') || url.hostname.includes('firebaseio') ||
      url.hostname.includes('gstatic') || url.hostname.includes('firestore')) {
    return;
  }

  // Cache-first for same-origin static assets
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response && response.status === 200 && event.request.method === 'GET') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Offline fallback: return cached index
        if (event.request.destination === 'document') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
