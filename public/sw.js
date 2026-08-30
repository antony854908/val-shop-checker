const CACHE_NAME = 'valstore-v5.8';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json',
  '/favicon.ico',
  '/assets/icon-192.png',
  '/assets/icon-512.png'
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
        const cached = await caches.match(e.request);
        if (cached) {
          return cached;
        }
        return new Response('', { status: 408, statusText: 'Network Unavailable / Offline' });
      })
  );
});
