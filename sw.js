/* Beaver Reader service worker: the app works offline, updates wait for you, notifications open the app.
   The build writes VERSION and FILES; a new build means a new VERSION, so the page shows "New version ready". */
const VERSION = 'reader-eaa842e02441';                     // filled in by the build (a hash of every file)
const FILES = ["./","assets/Reader-BD3ofZTb.js","assets/Reader-BD3ofZTb.js.map","assets/_commonjs-dynamic-modules-Ch8JAEIu.js","assets/_commonjs-dynamic-modules-Ch8JAEIu.js.map","assets/beaver-book-QBAVr6Nj.js","assets/beaver-book-QBAVr6Nj.js.map","assets/da-CMTKVXMy.js","assets/da-CMTKVXMy.js.map","assets/da-CsIXjgJM.js","assets/da-CsIXjgJM.js.map","assets/de-CURDvTVb.js","assets/de-CURDvTVb.js.map","assets/de-DntDwrpK.js","assets/de-DntDwrpK.js.map","assets/epub-CTyICOGQ.js","assets/epub-CTyICOGQ.js.map","assets/es-5VZXhzEX.js","assets/es-5VZXhzEX.js.map","assets/es-B7alr3ef.js","assets/es-B7alr3ef.js.map","assets/fi-DFNpA97V.js","assets/fi-DFNpA97V.js.map","assets/fi-pN-JyUSe.js","assets/fi-pN-JyUSe.js.map","assets/fr-BT3e-lx5.js","assets/fr-BT3e-lx5.js.map","assets/fr-DyOlc0a6.js","assets/fr-DyOlc0a6.js.map","assets/index-yyfyVmKo.js","assets/index-yyfyVmKo.js.map","assets/ja-BmbfUo6f.js","assets/ja-BmbfUo6f.js.map","assets/ja-Bp9DAIx0.js","assets/ja-Bp9DAIx0.js.map","assets/nb-Boaf4gG2.js","assets/nb-Boaf4gG2.js.map","assets/nb-CF3O6BRt.js","assets/nb-CF3O6BRt.js.map","assets/pdf-CJ8Oj19w.js","assets/pdf-CJ8Oj19w.js.map","assets/pdf.worker.min-DrjRHSBX.js","assets/pdf.worker.min-DrjRHSBX.js.map","assets/pdf.worker.min-yatZIOMy.mjs","assets/silkscreen-latin-CtPo2yA5.woff2","assets/src-BlasuIVA.js","assets/src-BlasuIVA.js.map","assets/sv-B24F9PLN.js","assets/sv-B24F9PLN.js.map","assets/sv-ypX-588l.js","assets/sv-ypX-588l.js.map","assets/zh-B_MJ8kAh.js","assets/zh-B_MJ8kAh.js.map","assets/zh-Cf6ugFNH.js","assets/zh-Cf6ugFNH.js.map","icons/apple-touch-icon.png","icons/favicon-32.png","icons/favicon.svg","icons/icon-192.png","icons/icon-512.png","icons/icon-maskable-512.png","index.html","manifest.webmanifest"];
const RELEASE = "v1.23 · Just for You";                     // e.g. "v2.1 · Name Tags"
const FONTS = 'br-cjk-fonts-1';                  // the pixel CJK fonts: kept across versions, only once they're used

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' })))).then(() => {
    if (!self.registration.active) return self.skipWaiting();        // very first install: take over right away
  }));
});
// old versions go, but only ours: Beaver Focus lives on the same origin (beaver-apps.github.io/focus/) and its caches
// share this list. Ours are reader-...; before 1.18 both apps named theirs bf-..., so an old bf- cache is ours only
// if it holds our own start page.
const ours = async k => {
  if (k === VERSION || k === FONTS) return false;
  if (k.startsWith('reader-')) return true;
  if (!k.startsWith('bf-')) return false;
  const c = await caches.open(k);
  return (await c.keys()).some(r => r.url === self.registration.scope);
};
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(keys => Promise.all(keys.map(async k => { if (await ours(k)) await caches.delete(k); }))).then(() => self.clients.claim())
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
