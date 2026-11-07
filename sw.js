/* Beaver Reader service worker: the app works offline, updates wait for you, notifications open the app.
   The build writes VERSION and FILES; a new build means a new VERSION, so the page shows "New version ready". */
const VERSION = 'bf-363c2493495d';                     // filled in by the build (a hash of every file)
const FILES = ["./","assets/Reader-nkflguQ8.js","assets/Reader-nkflguQ8.js.map","assets/_commonjs-dynamic-modules-Ch8JAEIu.js","assets/_commonjs-dynamic-modules-Ch8JAEIu.js.map","assets/beaver-book-uvmKo4C4.js","assets/beaver-book-uvmKo4C4.js.map","assets/epub-CTyICOGQ.js","assets/epub-CTyICOGQ.js.map","assets/index-CZFftvf7.js","assets/index-CZFftvf7.js.map","assets/pdf-CJ8Oj19w.js","assets/pdf-CJ8Oj19w.js.map","assets/pdf.worker.min-DrjRHSBX.js","assets/pdf.worker.min-DrjRHSBX.js.map","assets/pdf.worker.min-yatZIOMy.mjs","assets/silkscreen-latin-CtPo2yA5.woff2","assets/src-BlasuIVA.js","assets/src-BlasuIVA.js.map","icons/apple-touch-icon.png","icons/favicon-32.png","icons/favicon.svg","icons/icon-192.png","icons/icon-512.png","icons/icon-maskable-512.png","index.html","manifest.webmanifest"];
const RELEASE = "v1.14 · Butterpaws";                     // e.g. "v2.1 · Name Tags"

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' })))).then(() => {
    if (!self.registration.active) return self.skipWaiting();        // very first install: take over right away
  }));
});
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())
));
self.addEventListener('message', e => {
  if (e.data === 'skip-waiting') self.skipWaiting();                        // the user tapped "update"
  if (e.data === 'release' && e.ports[0]) e.ports[0].postMessage(RELEASE);  // the page asks which version this is
});

self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;   // GitHub sync etc. go straight to the network
  e.respondWith(caches.match(req, { ignoreSearch: req.mode === 'navigate' }).then(hit => hit || fetch(req).catch(() =>
    req.mode === 'navigate' ? caches.match('index.html') : Response.error())));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) if ('focus' in c) return c.focus();
    return self.clients.openWindow('./');
  }));
});
