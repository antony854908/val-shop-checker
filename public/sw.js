const CACHE_NAME = 'valstore-v2.7.2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/theme-valorant.css',
  '/theme-soft.css',
  '/theme-halloween.css',
  '/theme-seasonal.css',
  '/app.js',
  '/manifest.json',
  '/favicon.ico',
  '/assets/icon-192.png',
  '/assets/icon-512.png',
  '/assets/placeholder-skin.svg',
  '/assets/christmas/bg-winter-desktop.webp',
  '/assets/christmas/bg-winter-mobile.webp',
  '/assets/christmas/christmas-tree.webp',
  '/assets/lunar/bg-lunar-desktop.webp',
  '/assets/lunar/bg-lunar-mobile.webp',
  '/assets/lunar/lunar-lanterns.webp',
  '/assets/sakura/bg-sakura-desktop.webp',
  '/assets/sakura/bg-sakura-mobile.webp',
  '/assets/sakura/sakura-branch.webp',
  '/assets/months/m01/bg-desktop.webp',
  '/assets/months/m01/bg-mobile.webp',
  '/assets/months/m01/prop.webp',
  '/assets/months/m04/bg-desktop.webp',
  '/assets/months/m04/bg-mobile.webp',
  '/assets/months/m04/prop.webp',
  '/assets/months/m05/bg-desktop.webp',
  '/assets/months/m05/bg-mobile.webp',
  '/assets/months/m05/prop.webp',
  '/assets/months/m06/bg-desktop.webp',
  '/assets/months/m06/bg-mobile.webp'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS).catch(() => {}))
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  // Only intercept GET requests with http/https schemes
  if (!e.request || !e.request.url || !e.request.url.startsWith('http') || e.request.method !== 'GET') {
    return;
  }

  // Leave cross-origin requests (CDN scripts, valorant-api images) to the browser:
  // re-fetching them here is bound by the worker's connect-src CSP and fails,
  // and only same-origin ('basic') responses are ever cached below anyway.
  if (new URL(e.request.url).origin !== self.location.origin) {
    return;
  }

  // Never intercept API endpoints, video streams, or large CDN media
  const url = e.request.url;
  const dest = e.request.destination;
  if (
    url.includes('/api/') ||
    url.includes('.mp4') ||
    url.includes('.webm') ||
    url.includes('riotcdn.net') ||
    dest === 'video' ||
    dest === 'audio'
  ) {
    return;
  }

  // Network first with guaranteed valid Response fallback
  e.respondWith(
    fetch(e.request)
      .then(networkResponse => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const resClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, resClone)).catch(() => {});
        }
        return networkResponse;
      })
      .catch(async () => {
        const cached = await caches.match(e.request, { ignoreSearch: true });
        if (cached) {
          return cached;
        }
        return new Response('', { status: 408, statusText: 'Network Unavailable / Offline' });
      })
  );
});
