// Minimal Service Worker: Offline App-Shell Caching (First-party only)
// Version is passed via query param v= in the registration URL.

/* eslint-disable no-restricted-globals */

const getVersionFromUrl = () => {
	try {
		const url = new URL(self.location.href);
		return url.searchParams.get('v') || 'dev';
	} catch (_) {
		return 'dev';
	}
};

const CACHE_VERSION = getVersionFromUrl();
const CACHE_NAME = `app-cache-${CACHE_VERSION}`;

// Precache only first-party app shell assets. Third-party (e.g., Google Fonts) are not precached.
const PRECACHE_ASSETS = [
	'/',
	'/index.html',
	'/chronicle.html',
	'/character.html',
	'/settings.html',
	'/manifest.json',
	'/favicon.svg',
	// CSS
	'/css/main.css',
	'/css/components/tabs.css',
	'/css/components/ai-prompt.css',
	'/css/components/character-form.css',
	'/css/components/settings.css',
	'/css/components/sync-status.css',
	// JS entry points and core modules
	'/js/journal.js',
	'/js/chronicle.js',
	'/js/character.js',
	'/js/settings.js',
	'/js/journal-views.js',
	'/js/character-views.js',
	'/js/utils.js',
	'/js/navigation-cache.js',
	'/js/ai.js',
	'/js/summarization.js',
	'/js/context.js',
	'/js/yjs.js',
	'/js/version.js'
];

self.addEventListener('install', (event) => {
	event.waitUntil(
		caches.open(CACHE_NAME)
			.then((cache) => cache.addAll(PRECACHE_ASSETS))
	);
	self.skipWaiting();
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches.keys().then((keys) =>
			Promise.all(
				keys
					.filter((key) => key !== CACHE_NAME)
					.map((key) => caches.delete(key))
			)
		)
	);
	self.clients.claim();
});

// Helper: same-origin check
const isSameOrigin = (request) => {
	try {
		const url = new URL(request.url);
		return url.origin === self.location.origin;
	} catch (_) {
		return false;
	}
};

self.addEventListener('fetch', (event) => {
	const { request } = event;
	if (request.method !== 'GET') {
		return;
	}

	// Navigation requests: cache-first app shell with network fallback
	if (request.mode === 'navigate') {
		event.respondWith(
			// Try network first so navigations reach their real pages
			fetch(request)
				.then((response) => {
					// Cache successful navigations for offline use
					if (response.ok) {
						const clone = response.clone();
						caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
					}
					return response;
				})
				.catch(() =>
					// If offline, serve a cached copy of the request or fall back to index
					caches.match(request).then((cached) => cached || caches.match('/index.html'))
				)
		);
		return;
	}

	// Static assets: cache-first for same-origin, runtime-cache on first fetch
	if (isSameOrigin(request)) {
		event.respondWith(
			caches.match(request).then((cached) => {
				if (cached) return cached;
				return fetch(request)
					.then((response) => {
						// Only cache successful, basic/opaque responses from same-origin
						if (response.ok) {
							const clone = response.clone();
							caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
						}
						return response;
					})
					.catch(() => caches.match('/index.html'));
			})
		);
	}
});

