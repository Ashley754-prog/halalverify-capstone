const CACHE_NAME = "halalverify-cache-v1";
const ASSETS_TO_CACHE = [
    "/",
    "/index.html",
    "/manifest.json",
    "/offline.html",
    "/halalverify-logo.png"
];

// Install Event - Caching App Shell
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
    );
    self.skipWaiting();
});

// Activate Event - Clean old caches
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch Event
self.addEventListener("fetch", (event) => {
    const url = new URL(event.request.url);

    // 1. Only handle GET requests
    // 2. Ignore non-http/https requests (e.g., chrome-extension://)
    // 3. Bypass cache for FastAPI backend calls (e.g., endpoints containing /api/ or backend ports)
    if (
        event.request.method !== "GET" || 
        !url.protocol.startsWith("http") || 
        url.pathname.startsWith("/api")
    ) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;

            return fetch(event.request)
                .then((response) => {
                    // Check for valid response before caching
                    if (!response || response.status !== 200 || response.type !== "basic") {
                        return response;
                    }

                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });

                    return response;
                })
                .catch(() => {
                    // Fallback to offline page for page navigations
                    if (event.request.mode === "navigate") {
                        return caches.match("/offline.html");
                    }
                });
        })
    );
});