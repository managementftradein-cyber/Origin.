/* ==========================================================================
   The Christocentric Church — service worker
   - Works offline: pages you have opened, the app shell and key content still load
   - Always asks the network first for pages / scripts / content, so updates arrive immediately
   - NEVER touches admin pages, logins, uploads, live status, forms or other websites
   To release a new version of the app files, bump VERSION below.
   ========================================================================== */
const VERSION = 'tcc-v1';
const PAGES = VERSION + '-pages';
const ASSETS = VERSION + '-assets';
const API = VERSION + '-api';

const PRECACHE = [
  '/offline', '/assets/logo-emblem.png', '/assets/logo-wordmark.png', '/assets/pwa/icon-192.png',
  '/tcc-fx.css', '/tcc-fx.js', '/tcc-library.js', '/tcc-live.js', '/tcc-livebar.js', '/tcc-welcome.js', '/tcc-pwa.js', '/assets/welcome/welcome-cutout-sm.webp', '/assets/welcome/tcc-pattern.png', '/accent-color.js'
];
/* every one of these is the same single-page shell (index.html) */
const SPA_ROUTES = ['/', '/about', '/programs', '/partnership', '/college', '/contact', '/give', '/find-us'];
/* public content that is fine to show from the last successful load when offline */
const API_CACHEABLE = ['/api/site-content', '/api/events', '/api/departments', '/api/news', '/api/prophetic-words', '/api/giving'];
/* never intercepted: always go straight to the network */
const NEVER = ['/admin', '/dept-admin', '/api/'];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const okBasic = (res) => res && res.ok && res.type === 'basic' && !res.redirected;

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const assets = await caches.open(ASSETS);
    await Promise.all(PRECACHE.map(async (u) => { try { const r = await fetch(u, { cache: 'reload' }); if (okBasic(r)) await assets.put(u, r); } catch (_) {} }));
    const pages = await caches.open(PAGES);
    try { const shell = await fetch('/', { cache: 'reload' }); if (okBasic(shell)) await pages.put('/', shell); } catch (_) {}
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => !k.startsWith(VERSION + '-')).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => { if (event.data === 'SKIP_WAITING') self.skipWaiting(); });

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;          // YouTube, Facebook, Supabase, fonts… untouched
  if (req.headers.has('range')) return;                      // video seeking
  const p = url.pathname;

  if (req.mode === 'navigate') {
    if (NEVER.slice(0, 2).some((x) => p === x || p.startsWith(x + '/'))) return;
    event.respondWith(handleNavigate(req));
    return;
  }
  if (p.startsWith('/api/')) {
    if (API_CACHEABLE.includes(p)) event.respondWith(networkFirst(req, API, 4000));
    return;                                                  // everything else in /api is never cached
  }
  if (NEVER.slice(0, 2).some((x) => p === x || p.startsWith(x + '/'))) return;
  if (/\.(mp4|webm|mov|m4v)$/i.test(p)) return;              // large media: leave to the browser
  if (/\.(js|css|webmanifest|json)$/i.test(p)) { event.respondWith(networkFirst(req, ASSETS, 3500)); return; }
  if (/\.(png|jpe?g|webp|gif|svg|ico|avif|woff2?|ttf)$/i.test(p)) { event.respondWith(staleWhileRevalidate(req)); return; }
});

async function handleNavigate(req) {
  const cache = await caches.open(PAGES);
  const path = new URL(req.url).pathname.replace(/\/$/, '') || '/';
  const key = SPA_ROUTES.includes(path) ? '/' : req;
  const cached = await cache.match(key, { ignoreSearch: true });
  const net = fetch(req).then((res) => { if (okBasic(res)) cache.put(key, res.clone()); return res; });
  if (cached) {                                              // known page: wait a few seconds for fresh, else show saved copy
    const res = await Promise.race([net.catch(() => null), sleep(4500)]);
    return res || cached;
  }
  try { return await net; }
  catch (_) { return (await caches.match('/offline')) || Response.error(); }
}

async function networkFirst(req, cacheName, ms) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  const net = fetch(req).then((res) => { if (okBasic(res)) { cache.put(req, res.clone()).then(() => trim(cacheName, 160)); } return res; });
  if (!cached) return net;
  const res = await Promise.race([net.catch(() => null), sleep(ms)]);
  return res || cached;
}

async function staleWhileRevalidate(req) {
  const cache = await caches.open(ASSETS);
  const cached = await cache.match(req);
  const net = fetch(req).then((res) => { if (okBasic(res)) { cache.put(req, res.clone()).then(() => trim(ASSETS, 160)); } return res; }).catch(() => null);
  return cached || (await net) || Response.error();
}

async function trim(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
}
