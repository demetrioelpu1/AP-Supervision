// Service worker de la herramienta AP: instalación como app, copia sin señal y recepción de archivos compartidos
const CACHE = 'ap-v17';
const BASE = ['./', './index.html', './manifest.webmanifest', './icono_AP_192.png', './icono_AP_512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASE)).catch(() => {})); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(k => Promise.all(
  k.filter(x => x !== CACHE && x !== 'ap-compartidos').map(x => caches.delete(x))))); self.clients.claim(); });

self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  // Archivos compartidos desde WhatsApp u otra app (Compartir → AP)
  if (e.request.method === 'POST' && u.pathname.endsWith('/compartir')) {
    e.respondWith((async () => {
      try {
        const datos = await e.request.formData();
        const archivos = datos.getAll('archivos');
        const cache = await caches.open('ap-compartidos');
        let i = 0;
        for (const f of archivos) {
          if (!f || typeof f === 'string') continue;
          await cache.put('./compartido/' + Date.now() + '-' + (i++),
            new Response(f, { headers: { 'x-nombre': encodeURIComponent(f.name || 'archivo.geojson') } }));
        }
      } catch (err) {}
      return Response.redirect('./?compartido=1', 303);
    })());
    return;
  }
  const propio = u.origin === location.origin || u.hostname === 'cdnjs.cloudflare.com';
  if (e.request.method !== 'GET' || !propio) return;   // mapas, búsquedas y altitud van directo a internet
  // primero internet (para recibir actualizaciones); si no hay señal, usa la copia guardada
  e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(CACHE).then(k => k.put(e.request, c)); return r; })
    .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html'))));
});
