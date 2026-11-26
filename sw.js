// AN NINH EDUTECH - Service Worker (Anti-Stale-Cache + Full Offline Exam Engine)
// - Network-First for internal app HTML/CSS/JS so Cloudflare Pages updates apply immediately.
// - Automatic purge of old CACHE_VERSION buckets during activate + clients.claim().
// - Cache-First for external CDN libraries (KaTeX, Mammoth, SheetJS, PDF.js, Chart.js, DOMPurify, Tailwind, Lucide, Fonts).

const CACHE_VERSION = 'v2026-11-26-04';
const APP_CACHE = `anninh-edutech-app-${CACHE_VERSION}`;
const CDN_CACHE = `anninh-edutech-cdn-${CACHE_VERSION}`;
const KEEP_CACHES = new Set([APP_CACHE, CDN_CACHE]);

const APP_SHELL_URLS = [
  '/',
  '/index.html',
  '/js/share-exam.js',
  '/manifest.json',
  '/logo.png',
  '/icon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png'
];

const CDN_PRECACHE_URLS = [
  'https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&display=swap',
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/lucide@0.469.0/dist/umd/lucide.min.js',
  'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css',
  'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js',
  'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
  'https://cdn.jsdelivr.net/npm/lz-string@1.5.0/libs/lz-string.min.js',
  'https://cdn.jsdelivr.net/npm/qrcode@1.5.1/build/qrcode.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js',
  'https://cdn.jsdelivr.net/npm/dompurify@3.1.6/dist/purify.min.js',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js',
  'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/dist/confetti.browser.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
];

const CDN_HOSTS = new Set([
  'cdn.jsdelivr.net',
  'cdnjs.cloudflare.com',
  'cdn.tailwindcss.com',
  'unpkg.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com'
]);

const ANALYTICS_HOSTS = new Set([
  'cloudflareinsights.com',
  'static.cloudflareinsights.com'
]);

function isCdnAssetUrl(urlObj) {
  if (CDN_HOSTS.has(urlObj.hostname)) return true;
  const hrefLower = urlObj.href.toLowerCase();
  return (
    hrefLower.includes('katex') ||
    hrefLower.includes('mammoth') ||
    hrefLower.includes('dompurify') ||
    hrefLower.includes('chart.js')
  );
}

async function fetchAndStoreCdn(cache, url) {
  try {
    const corsRes = await fetch(url, { mode: 'cors' });
    if (corsRes && corsRes.ok) {
      await cache.put(url, corsRes.clone());
      return corsRes;
    }
  } catch (e) { }

  try {
    const opaqueRes = await fetch(url, { mode: 'no-cors' });
    if (opaqueRes) {
      await cache.put(url, opaqueRes.clone());
      return opaqueRes;
    }
  } catch (e) { }
  return null;
}

async function precacheCssFonts(cdnCache, baseUrl, cssText) {
  if (!cssText) return;
  const matches = [...cssText.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/gi)];
  const fontUrls = new Set();
  for (const m of matches) {
    const raw = (m[1] || '').trim();
    if (!raw || raw.startsWith('data:')) continue;
    try {
      const resolved = new URL(raw, baseUrl).href;
      if (/\.woff2?(?:[?#].*)?$/i.test(resolved) || resolved.includes('fonts.gstatic.com')) {
        fontUrls.add(resolved);
      }
    } catch (e) { }
  }
  await Promise.allSettled(
    Array.from(fontUrls).map(fontUrl => fetchAndStoreCdn(cdnCache, fontUrl))
  );
}

function isValidAppAssetResponse(pathname, res) {
  if (!res || !res.ok) return false;
  const ct = (res.headers.get('content-type') || '').toLowerCase();
  if (/\.(?:png|jpe?g|svg|webp|ico)$/i.test(pathname) && ct.includes('text/html')) {
    return false;
  }
  if (/manifest\.json$/i.test(pathname) && ct.includes('text/html')) {
    return false;
  }
  return true;
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const appCache = await caches.open(APP_CACHE);
    await Promise.allSettled(
      APP_SHELL_URLS.map(async (assetUrl) => {
        const res = await fetch(assetUrl, { cache: 'no-cache' });
        if (isValidAppAssetResponse(assetUrl, res)) {
          await appCache.put(assetUrl, res);
        }
      })
    );

    const cdnCache = await caches.open(CDN_CACHE);
    await Promise.allSettled(
      CDN_PRECACHE_URLS.map(async (cdnUrl) => {
        const existing = await cdnCache.match(cdnUrl, { ignoreVary: true });
        let res = existing;
        if (!res) {
          res = await fetchAndStoreCdn(cdnCache, cdnUrl);
        }
        if (res && res.ok && res.type !== 'opaque') {
          const ct = res.headers.get('content-type') || '';
          if (ct.includes('text/css') || cdnUrl.includes('katex.min.css') || cdnUrl.includes('fonts.googleapis.com')) {
            try {
              const cssText = await res.clone().text();
              await precacheCssFonts(cdnCache, cdnUrl, cssText);
            } catch (e) { }
          }
        }
      })
    );

    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter(k => !KEEP_CACHES.has(k))
        .map(k => caches.delete(k))
    );
    await self.clients.claim();
  })());
});

async function cacheFirstCdn(request) {
  const cdnCache = await caches.open(CDN_CACHE);
  const cached =
    (await cdnCache.match(request, { ignoreVary: true })) ||
    (await cdnCache.match(request.url, { ignoreVary: true }));
  if (cached) return cached;

  try {
    const networkRes = await fetch(request);
    if (networkRes && (networkRes.ok || networkRes.type === 'opaque')) {
      await cdnCache.put(request, networkRes.clone());
      return networkRes;
    }
    return networkRes;
  } catch (err) {
    if (request.destination === 'font' || /\.(?:woff2?|ttf|eot)(?:[?#].*)?$/i.test(request.url)) {
      return new Response('', { status: 204, statusText: 'Offline Font Skipped' });
    }
    throw err;
  }
}

async function networkFirstApp(request) {
  const appCache = await caches.open(APP_CACHE);
  const urlObj = new URL(request.url);
  const bypassUrl = urlObj.pathname + urlObj.search;

  try {
    const fetchTarget = urlObj.origin === self.location.origin
      ? fetch(bypassUrl, { cache: 'no-cache' })
      : fetch(request);
    const networkRes = await fetchTarget;
    if (isValidAppAssetResponse(urlObj.pathname, networkRes)) {
      await appCache.put(request, networkRes.clone());
      if (request.mode === 'navigate' && (urlObj.pathname === '/' || urlObj.pathname === '/index.html')) {
        await appCache.put('/', networkRes.clone());
        await appCache.put('/index.html', networkRes.clone());
      }
    }
    return networkRes;
  } catch (err) {
    const cached =
      (await appCache.match(request, { ignoreSearch: true })) ||
      (await caches.match(request, { ignoreSearch: true }));
    if (cached) return cached;

    if (request.mode === 'navigate') {
      const shell =
        (await appCache.match('/index.html')) ||
        (await appCache.match('/'));
      if (shell) return shell;
    }
    throw err;
  }
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).pathname.startsWith('/api/')) return;
  const { request } = event;
  if (!request) return;

  let urlObj;
  try {
    urlObj = new URL(request.url);
  } catch (e) {
    return;
  }

  if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') return;

  if (ANALYTICS_HOSTS.has(urlObj.hostname)) {
    event.respondWith(
      fetch(request).catch(() => new Response('', { status: 204, statusText: 'Offline Beacon Skipped' }))
    );
    return;
  }

  if (isCdnAssetUrl(urlObj)) {
    event.respondWith(cacheFirstCdn(request));
    return;
  }

  if (urlObj.origin === self.location.origin) {
    event.respondWith(networkFirstApp(request));
  }
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
