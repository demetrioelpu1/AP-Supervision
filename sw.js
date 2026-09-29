// Service worker de la herramienta AP: permite instalarla como app y abrirla aunque falle la señal
const CACHE = 'ap-v1';
const BASE = ['./', './index.html', './manifest.webmanifest', './icono_AP_192.png', './icono_AP_512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASE)).catch(() => {})); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== CACHE).map(x => caches.delete(x))))); self.clients.claim(); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  const propio = u.origin === location.origin || u.hostname === 'cdnjs.cloudflare.com';
  if (e.request.method !== 'GET' || !propio) return;           // mapas, búsquedas y altitud van directo a internet
  // primero internet (para recibir actualizaciones); si no hay señal, usa la copia guardada
  e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(CACHE).then(k => k.put(e.request, c)); return r; })
    .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html'))));
});
