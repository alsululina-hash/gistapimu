// Сервис-воркер: хранит сайт в кэше браузера для работы без интернета. Генерируется make_offline.py.
const CORE = 'core-2c9a7ff8bc', MEDIA = 'media-93fbfda6a6', FONTS = 'fonts-v1';
importScripts('offline_list.js');
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CORE).then(c => c.addAll(self.OFFLINE.files)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => ![CORE, MEDIA, FONTS].includes(k)).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(caches.open(FONTS).then(async c => {
      const hit = await c.match(req);
      const net = fetch(req).then(r => { c.put(req, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    }));
    return;
  }
  if (url.origin !== location.origin) return;
  e.respondWith((async () => {
    const hit = await caches.match(req, { ignoreSearch: true }) || (req.mode === 'navigate' ? await caches.match('index.html') : null);
    if (hit) return hit;
    try {
      const r = await fetch(req);
      if (r.ok && !url.pathname.endsWith('.zip')) {
        const c = await caches.open(/\.jpe?g$/i.test(url.pathname) ? MEDIA : CORE); c.put(req, r.clone());
      }
      return r;
    } catch (err) {
      return new Response('Нет подключения к интернету, а этот файл ещё не сохранён.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    }
  })());
});
