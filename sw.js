const CACHE_NAME = 'portafolio-v1';
const ASSETS_TO_CACHE = [
  '/Aplicacion/',
  '/Aplicacion/index.html',
  '/Aplicacion/html/registro.html',
  '/Aplicacion/Css/diseño.css',
  '/Aplicacion/js/registro.js',
  '/Aplicacion/manifest.json',
  '/Aplicacion/icono.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});