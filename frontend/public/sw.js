const CACHE_NAME = "halalverify-cache-v2";
const ASSETS_TO_CACHE = [
    "/",
    "/index.html",
    "/manifest.json",
    "/offline.html",
    "/halalverify-logo.png"
];

// Install Event - Pre-cache critical offline shell and activate immediately
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
    );
    self.skipWaiting();
});

// Activate Event - Evict any outdated caches from prior versions immediately
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        console.log(`[ServiceWorker] Evicting legacy cache: ${key}`);
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

    // Network-First for Navigation / HTML documents:
    // Ensures mobile and web visitors ALWAYS fetch the latest deployed build when online.
    // Falls back to offline shell or cache only when device is disconnected.
    if (event.request.mode === "navigate" || url.pathname === "/" || url.pathname.endsWith(".html")) {
        event.respondWith(
            fetch(event.request)
                .then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
                    }
                    return networkResponse;
                })
                .catch(() => {
                    return caches.match(event.request).then((cached) => cached || caches.match("/offline.html"));
                })
        );
        return;
    }

    // Cache-First with Network Fallback for immutable hashed assets (/assets/*, fonts, icons)
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;

            return fetch(event.request)
                .then((response) => {
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
                    if (event.request.mode === "navigate") {
                        return caches.match("/offline.html");
                    }
                });
        })
    );
});

// Allow client pages to trigger immediate skipWaiting
self.addEventListener("message", (event) => {
    if (event.data && event.data.type === "SKIP_WAITING") {
        self.skipWaiting();
    }
});