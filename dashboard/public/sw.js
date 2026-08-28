// Service Worker for NURIOH PWA App Installation (No-Cache Bypass)
const CACHE_NAME = 'nurioh-nocache-v4';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((key) => caches.delete(key)));
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // 항상 네트워크 최신 응답 통과
  event.respondWith(fetch(event.request));
});
