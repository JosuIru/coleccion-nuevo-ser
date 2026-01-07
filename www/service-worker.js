/**
 * SERVICE WORKER - PWA & Offline Support
 * =======================================
 * Estrategias de cache para funcionamiento offline y mejor performance
 *
 * @version 1.0.0
 */

const CACHE_VERSION = 'coleccion-nuevo-ser-v2.9.283';
const CACHE_STATIC = `${CACHE_VERSION}-static`;
const CACHE_DYNAMIC = `${CACHE_VERSION}-dynamic`;
const CACHE_IMAGES = `${CACHE_VERSION}-images`;

// Assets críticos para funcionamiento offline
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',

  // Core CSS
  '/css/core.css',
  '/css/design-tokens.css',
  '/css/tailwind-fallback.css',

  // Core JS - solo lo esencial
  '/js/utils/event-manager.js',
  '/js/utils/storage-helper.js',
  '/js/utils/lazy-loader.js',
  '/js/core/logger.js',
  '/js/core/toast.js',
  '/js/core/icons.js',
  '/js/core/i18n.js',
  '/js/core/book-engine.js',
  '/js/core/biblioteca.js',

  // Iconos
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png',
  '/assets/icons/favicon.ico'
];

// Patrones de URLs a cachear dinámicamente
const DYNAMIC_CACHE_PATTERNS = [
  /\/books\/.*\/book\.json$/,
  /\/books\/.*\/config\.json$/,
  /\/js\//,
  /\/css\//
];

// Patrones a NO cachear
const NO_CACHE_PATTERNS = [
  /\/api\//,
  /supabase\.co/,
  /google-analytics\.com/,
  /googletagmanager\.com/,
  /analytics\.js/
];

/**
 * Install event - cachear assets estáticos
 */
self.addEventListener('install', event => {
  console.log('[SW] Installing Service Worker v' + CACHE_VERSION);

  event.waitUntil(
    caches.open(CACHE_STATIC)
      .then(cache => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { cache: 'reload' })));
      })
      .catch(error => {
        console.error('[SW] Error caching static assets:', error);
      })
      .then(() => self.skipWaiting())
  );
});

/**
 * Activate event - limpiar caches antiguas
 */
self.addEventListener('activate', event => {
  console.log('[SW] Activating Service Worker v' + CACHE_VERSION);

  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_STATIC &&
                cacheName !== CACHE_DYNAMIC &&
                cacheName !== CACHE_IMAGES &&
                cacheName.startsWith('coleccion-nuevo-ser')) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

/**
 * Fetch event - estrategias de cache
 */
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip requests to no-cache patterns
  if (NO_CACHE_PATTERNS.some(pattern => pattern.test(url.href))) {
    return;
  }

  // Estrategia basada en tipo de recurso
  if (url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)$/)) {
    // Imágenes: Cache First
    event.respondWith(cacheFirstStrategy(request, CACHE_IMAGES));
  } else if (url.pathname.match(/\.(js|css)$/)) {
    // JS/CSS: Stale While Revalidate
    event.respondWith(staleWhileRevalidateStrategy(request, CACHE_STATIC));
  } else if (DYNAMIC_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    // JSON de libros: Network First
    event.respondWith(networkFirstStrategy(request, CACHE_DYNAMIC));
  } else if (url.pathname === '/' || url.pathname.endsWith('.html')) {
    // HTML: Network First
    event.respondWith(networkFirstStrategy(request, CACHE_STATIC));
  } else {
    // Otros: Stale While Revalidate
    event.respondWith(staleWhileRevalidateStrategy(request, CACHE_DYNAMIC));
  }
});

/**
 * Cache First - Intenta cache primero, luego red
 * Ideal para assets estáticos que no cambian
 */
async function cacheFirstStrategy(request, cacheName) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('[SW] Cache First failed:', error);
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

/**
 * Network First - Intenta red primero, luego cache
 * Ideal para contenido que cambia frecuentemente
 */
async function networkFirstStrategy(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('[SW] Serving from cache (offline):', request.url);
      return cachedResponse;
    }
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

/**
 * Stale While Revalidate - Devuelve cache inmediatamente, actualiza en segundo plano
 * Ideal para balance entre velocidad y frescura
 */
async function staleWhileRevalidateStrategy(request, cacheName) {
  const cachedResponse = await caches.match(request);

  const fetchPromise = fetch(request)
    .then(networkResponse => {
      if (networkResponse && networkResponse.status === 200) {
        const cache = caches.open(cacheName);
        cache.then(c => c.put(request, networkResponse.clone()));
      }
      return networkResponse;
    })
    .catch(() => cachedResponse);

  return cachedResponse || fetchPromise;
}

/**
 * Message event - comunicación con la app
 */
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'GET_CACHE_SIZE') {
    getCacheSize().then(size => {
      event.ports[0].postMessage({ size });
    });
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    clearAllCaches().then(() => {
      event.ports[0].postMessage({ success: true });
    });
  }
});

/**
 * Obtener tamaño total de caches
 */
async function getCacheSize() {
  let totalSize = 0;
  const cacheNames = await caches.keys();

  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();

    for (const request of requests) {
      const response = await cache.match(request);
      if (response) {
        const blob = await response.blob();
        totalSize += blob.size;
      }
    }
  }

  return totalSize;
}

/**
 * Limpiar todas las caches
 */
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  return Promise.all(
    cacheNames.map(cacheName => caches.delete(cacheName))
  );
}

console.log('[SW] Service Worker loaded v' + CACHE_VERSION);
