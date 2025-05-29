// Basic Service Worker for PWA installability

const CACHE_NAME = 'gastronomic-gatherer-cache-v1';
const urlsToCache = [
  '/',
  // Add other critical assets for app shell if known and stable
  // For Next.js, dynamic routes and hashed assets make this more complex without a build tool/plugin.
  // This basic SW primarily enables installation.
];

// Install event: opens a cache and adds core assets to it.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Cache opened');
        // Add core assets to cache. For a simple "offline page" experience,
        // caching '/' is a good start. More robust offline requires caching specific routes and assets.
        return cache.addAll(urlsToCache).catch(error => {
          console.error('Service Worker: Failed to cache urls:', error, urlsToCache);
        });
      })
      .catch(error => {
        console.error('Service Worker: Cache open failed:', error);
      })
  );
  self.skipWaiting(); // Activate the new service worker immediately
});

// Fetch event: serves assets from cache if available, falling back to network.
self.addEventListener('fetch', event => {
  // We only want to cache GET requests.
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          // Cache hit - return response
          return response;
        }
        // Not in cache - fetch from network
        return fetch(event.request).then(
          networkResponse => {
            // Check if we received a valid response
            if(!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            // IMPORTANT: Clone the response. A response is a stream
            // and because we want the browser to consume the response
            // as well as the cache consuming the response, we need
            // to clone it so we have two streams.
            const responseToCache = networkResponse.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          }
        ).catch(error => {
          console.warn('Service Worker: Fetch failed, probably offline.', error);
          // Optionally, return a custom offline page here if one is cached.
          // return caches.match('/offline.html');
        });
      })
  );
});

// Activate event: cleans up old caches.
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim(); // Take control of all open clients immediately
});
