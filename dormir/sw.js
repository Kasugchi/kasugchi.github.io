// Service worker de Duerme: guarda la app para que abra sin conexión.
// Sube VERSION cuando cambies index.html para que los móviles cojan la nueva.
const VERSION = 'duerme-1';
const ARCHIVOS = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

// Primero la red (para tener siempre la última versión) y, si no hay conexión, la copia guardada.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  e.respondWith(
    fetch(req).then(res => {
      if (res.ok && new URL(req.url).origin === location.origin) {
        const copia = res.clone();
        caches.open(VERSION).then(c => c.put(req, copia));
      }
      return res;
    }).catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
  );
});
