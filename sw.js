const CACHE_NAME = 'dnd-journal-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/character.html',
  '/settings.html',
  '/css/main.css',
  '/css/components/character-summary.css',
  '/css/components/ai-prompt.css',
  '/js/app.js',
  '/js/utils.js',
  '/js/sync.js',
  '/js/ai.js',
  '/js/summarization.js',
  '/sync-config.js',
  '/manifest.json',
  // External fonts and libraries will be handled by network-first strategy
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.log('Cache addAll failed:', error);
        // Continue installation even if some resources fail to cache
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache when offline, with network fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Handle different types of requests
  if (request.url.includes('fonts.googleapis.com') || 
      request.url.includes('fonts.gstatic.com') ||
      request.url.includes('unpkg.com')) {
    // For external resources, try network first, then cache
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request);
        })
    );
  } else {
    // For local resources, try cache first, then network
    event.respondWith(
      caches.match(request)
        .then((response) => {
          if (response) {
            return response;
          }
          return fetch(request)
            .then((response) => {
              if (response.status === 200) {
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(request, responseClone);
                });
              }
              return response;
            });
        })
        .catch(() => {
          // Return a basic offline page or the main page for navigation requests
          if (request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        })
    );
  }
});