/**
 * Rakhi Fitness — Offline Service Worker
 * -----------------------------------------------------------------------------
 * Strategy:
 *   - Precache the app shell on install.
 *   - Navigations: stale-while-revalidate (instant from cache, refresh in bg).
 *   - Static assets (same-origin GET): stale-while-revalidate.
 *   - /__/* (Firebase auth proxy) is never intercepted.
 * Bump CACHE_VERSION to invalidate old caches on deploy.
 */

const CACHE_VERSION = 'rakhi-fitness-v2';
const APP_SHELL = ['/', '/plan/', '/tracker/', '/progress/', '/checklist/', '/account/', '/manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  const url = new URL(request.url);

  // Only handle same-origin GET requests.
  if (request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  // Never intercept the Firebase auth proxy — it must always hit the network.
  if (url.pathname.startsWith('/__/')) {
    return;
  }

  // Navigation requests: stale-while-revalidate (instant from cache, refresh in
  // the background), falling back to the app shell when offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request)
          .then((response) => {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
            return response;
          })
          .catch(() => cached || caches.match('/'));
        return cached || network;
      })
    );
    return;
  }

  // Static assets: stale-while-revalidate.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
