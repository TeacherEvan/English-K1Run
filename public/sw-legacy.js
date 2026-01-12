/**
 * Service Worker - Progressive Web App Support
 * 
 * Provides offline capability and performance enhancements for the Kindergarten Race Game.
 * Implements a cache-first strategy for static assets with network fallback.
 * 
 * Features:
 * - Offline gameplay support
 * - Fast repeat visits with cached assets
 * - Background cache updates
 * - Stale-while-revalidate for optimal UX
 * 
 * Cache Strategy:
 * - Static assets (JS, CSS, images): Cache-first
 * - Audio files: Cache-first with network fallback
 * - HTML: Network-first with cache fallback
 * 
 * @version 1.0.0
 */

const CACHE_VERSION = 'kindergarten-race-v1.0.0'
const STATIC_CACHE = `${CACHE_VERSION}-static`
const AUDIO_CACHE = `${CACHE_VERSION}-audio`
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/vite.svg',
]

// Audio files are loaded dynamically but should be cached
const AUDIO_PATHS_PATTERN = /\.(wav|mp3|ogg)$/i

// Static assets (JS, CSS, images) pattern
const STATIC_PATHS_PATTERN = /\.(js|css|png|jpg|jpeg|svg|woff2?|ttf|eot)$/i

/**
 * Install Event - Cache critical assets
 * Occurs when service worker is first installed
 */
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installing version:', CACHE_VERSION)
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[ServiceWorker] Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        console.log('[ServiceWorker] Installation complete')
        // Force activation immediately
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('[ServiceWorker] Installation failed:', error)
      })
  )
})

/**
 * Activate Event - Clean up old caches
 * Occurs when service worker takes control
 */
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activating version:', CACHE_VERSION)
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        // Delete old cache versions
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName.startsWith('kindergarten-race-') && cacheName !== STATIC_CACHE && cacheName !== AUDIO_CACHE && cacheName !== RUNTIME_CACHE)
            .map((cacheName) => {
              console.log('[ServiceWorker] Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            })
        )
      })
      .then(() => {
        console.log('[ServiceWorker] Activation complete')
        // Take control of all pages immediately
        return self.clients.claim()
      })
  )
})

/**
 * Fetch Event - Serve from cache with intelligent strategies
 */
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) {
    return
  }

  // Handle audio files with dedicated cache
  if (AUDIO_PATHS_PATTERN.test(url.pathname)) {
    event.respondWith(cacheFirstWithRefresh(request, AUDIO_CACHE))
    return
  }

  // Handle static assets with cache-first strategy
  if (STATIC_PATHS_PATTERN.test(url.pathname)) {
    event.respondWith(cacheFirstWithRefresh(request, STATIC_CACHE))
    return
  }

  // Handle HTML with network-first strategy (for fresh content)
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirstWithCache(request, RUNTIME_CACHE))
    return
  }

  // Default: stale-while-revalidate for other requests
  event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE))
})

/**
 * Cache-First with Background Refresh Strategy
 * Returns cached response immediately, updates cache in background
 * 
 * @param {Request} request - Fetch request
 * @param {string} cacheName - Cache storage name
 * @returns {Promise<Response>} Cached or network response
 */
async function cacheFirstWithRefresh(request, cacheName) {
  try {
    const cache = await caches.open(cacheName)
    const cachedResponse = await cache.match(request)

    // Return cached response if available
    if (cachedResponse) {
      // Update cache in background (fire and forget)
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            cache.put(request, networkResponse.clone())
          }
        })
        .catch(() => {
          // Silently fail background update
        })
      
      return cachedResponse
    }

    // No cache, fetch from network and cache
    const networkResponse = await fetch(request)
    if (networkResponse && networkResponse.status === 200) {
      cache.put(request, networkResponse.clone())
    }
    return networkResponse

  } catch (error) {
    console.error('[ServiceWorker] Cache-first strategy failed:', error)
    // Return offline fallback if available
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' })
  }
}

/**
 * Network-First with Cache Fallback Strategy
 * Tries network first, falls back to cache on failure
 * 
 * @param {Request} request - Fetch request
 * @param {string} cacheName - Cache storage name
 * @returns {Promise<Response>} Network or cached response
 */
async function networkFirstWithCache(request, cacheName) {
  try {
    const networkResponse = await fetch(request)
    
    // Cache successful responses
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(cacheName)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse

  } catch (error) {
    // Network failed, try cache
    const cache = await caches.open(cacheName)
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      return cachedResponse
    }

    // Both failed
    console.error('[ServiceWorker] Network-first strategy failed:', error)
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' })
  }
}

/**
 * Stale-While-Revalidate Strategy
 * Returns cache immediately while updating in background
 * 
 * @param {Request} request - Fetch request
 * @param {string} cacheName - Cache storage name
 * @returns {Promise<Response>} Cached or network response
 */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cachedResponse = await cache.match(request)

  // Fetch from network and update cache (fire and forget)
  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse && networkResponse.status === 200) {
        cache.put(request, networkResponse.clone())
      }
      return networkResponse
    })
    .catch(() => {
      // Silently fail network update
    })

  // Return cache immediately if available, otherwise wait for network
  return cachedResponse || fetchPromise
}

/**
 * Message Event - Handle commands from client
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[ServiceWorker] Received SKIP_WAITING message')
    self.skipWaiting()
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    console.log('[ServiceWorker] Clearing all caches')
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)))
      })
    )
  }
})

console.log('[ServiceWorker] Service Worker loaded successfully')
