const CACHE_NAME = "halalverify-cache-v16";
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
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch Event - Dynamic Network First with Stale-While-Revalidate for offline resiliency
self.addEventListener("fetch", (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Completely bypass caching for non-GET requests (e.g., POST upload/scans)
    if (request.method !== "GET") {
        return;
    }

    // Bypass caching for live backend API calls and telemetry endpoints
    if (
        url.pathname.startsWith("/api") || 
        url.pathname.startsWith("/analyze") || 
        url.pathname.startsWith("/health") || 
        url.pathname.startsWith("/scan-history") || 
        url.pathname.startsWith("/dashboard-summary") ||
        url.hostname.includes("supabase.co") ||
        url.hostname.includes("onrender.com")
    ) {
        return;
    }

    // Static Assets & Navigation: Network-first with cache fallback
    event.respondWith(
        fetch(request)
            .then((networkResponse) => {
                // Cache valid response clones for offline readiness
                if (networkResponse && networkResponse.status === 200) {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, responseToCache);
                    });
                }
                return networkResponse;
            })
            .catch(async () => {
                const cachedResponse = await caches.match(request);
                if (cachedResponse) {
                    return cachedResponse;
                }
                // If an HTML navigation request fails while fully offline, serve offline shell
                if (request.mode === "navigate") {
                    return caches.match("/offline.html");
                }
                return new Response("Offline resource unavailable", {
                    status: 503,
                    statusText: "Service Unavailable",
                    headers: new Headers({ "Content-Type": "text/plain" })
                });
            })
    );
});
