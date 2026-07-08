// Service Worker básico para habilitar PWA
const CACHE_NAME = 'players-ld-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Necesario para que sea instalable, aunque no cacheemos nada por ahora
  event.respondWith(fetch(event.request));
});
