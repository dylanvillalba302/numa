// Numa · guarda la app en el teléfono para que abra sin conexión.
// Al publicar cambios, subí el número de versión para que los teléfonos se actualicen.
const CACHE = 'numa-v2.6.5';
const ARCHIVOS = ['./', './index.html', './config.js', './lib/supabase.js', './lib/591.supabase.js',
  './manifest.json', './icon-192.png', './icon-512.png', './apple-touch-icon.png', './privacidad.html'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;     // el servidor va directo a la red
  if (/\.shortcut$/.test(url.pathname)) return;                           // los atajos siempre frescos
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      const cache = await caches.open(CACHE);
      try {
        const res = await Promise.race([fetch(req), new Promise((_, rej) => setTimeout(() => rej(0), 3000))]);
        if (res && res.ok && !url.pathname.endsWith('privacidad.html')) cache.put('./index.html', res.clone());
        return res;
      } catch (err) {
        return (await cache.match(req)) || (await cache.match('./index.html')) || Response.error();
      }
    })());
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
    if (res.ok) caches.open(CACHE).then(c => c.put(req, res.clone()));
    return res;
  })));
});
