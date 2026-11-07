/* Beaver Reader service worker: the app works offline, updates wait for you, notifications open the app.
   The build writes VERSION and FILES; a new build means a new VERSION, so the page shows "New version ready". */
const VERSION = 'bf-f8d4adce794f';                     // filled in by the build (a hash of every file)
const FILES = ["./","assets/Reader-9hWqk4Su.js","assets/Reader-9hWqk4Su.js.map","assets/_commonjs-dynamic-modules-Ch8JAEIu.js","assets/_commonjs-dynamic-modules-Ch8JAEIu.js.map","assets/beaver-book-C9m-pexI.js","assets/beaver-book-C9m-pexI.js.map","assets/da-CP1YPWOf.js","assets/da-CP1YPWOf.js.map","assets/da-CsIXjgJM.js","assets/da-CsIXjgJM.js.map","assets/de-CURDvTVb.js","assets/de-CURDvTVb.js.map","assets/de-DaPAPgqT.js","assets/de-DaPAPgqT.js.map","assets/epub-CTyICOGQ.js","assets/epub-CTyICOGQ.js.map","assets/es-B7alr3ef.js","assets/es-B7alr3ef.js.map","assets/es-DOF4ZH0V.js","assets/es-DOF4ZH0V.js.map","assets/fi-DFNpA97V.js","assets/fi-DFNpA97V.js.map","assets/fi-urxPnV29.js","assets/fi-urxPnV29.js.map","assets/fr-BkrpTGWf.js","assets/fr-BkrpTGWf.js.map","assets/fr-DyOlc0a6.js","assets/fr-DyOlc0a6.js.map","assets/index-Bcgkvp1z.js","assets/index-Bcgkvp1z.js.map","assets/ja-Bp9DAIx0.js","assets/ja-Bp9DAIx0.js.map","assets/ja-Brjj_eWP.js","assets/ja-Brjj_eWP.js.map","assets/nb-BDYH0ne8.js","assets/nb-BDYH0ne8.js.map","assets/nb-Boaf4gG2.js","assets/nb-Boaf4gG2.js.map","assets/pdf-CJ8Oj19w.js","assets/pdf-CJ8Oj19w.js.map","assets/pdf.worker.min-DrjRHSBX.js","assets/pdf.worker.min-DrjRHSBX.js.map","assets/pdf.worker.min-yatZIOMy.mjs","assets/silkscreen-latin-CtPo2yA5.woff2","assets/src-BlasuIVA.js","assets/src-BlasuIVA.js.map","assets/sv-DxPIwSls.js","assets/sv-DxPIwSls.js.map","assets/sv-ypX-588l.js","assets/sv-ypX-588l.js.map","assets/zh-CWZo63GG.js","assets/zh-CWZo63GG.js.map","assets/zh-Cf6ugFNH.js","assets/zh-Cf6ugFNH.js.map","icons/apple-touch-icon.png","icons/favicon-32.png","icons/favicon.svg","icons/icon-192.png","icons/icon-512.png","icons/icon-maskable-512.png","index.html","manifest.webmanifest"];
const RELEASE = "v1.17 · Dust Bunnies";                     // e.g. "v2.1 · Name Tags"
const FONTS = 'br-cjk-fonts-1';                  // the pixel CJK fonts: kept across versions, only once they're used

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' })))).then(() => {
    if (!self.registration.active) return self.skipWaiting();        // very first install: take over right away
  }));
});
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION && k !== FONTS).map(k => caches.delete(k)))).then(() => self.clients.claim())
));
self.addEventListener('message', e => {
  if (e.data === 'skip-waiting') self.skipWaiting();                        // the user tapped "update"
  if (e.data === 'release' && e.ports[0]) e.ports[0].postMessage(RELEASE);  // the page asks which version this is
});

self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;   // GitHub sync etc. go straight to the network
  if (url.pathname.includes('/fonts/fusion-pixel/')) {                          // a CJK font: from the network once, then from the cache
    e.respondWith(caches.open(FONTS).then(c => c.match(req).then(hit => hit || fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); return r; }))));
    return;
  }
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
