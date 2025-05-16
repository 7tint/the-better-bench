self.publicPath = "/";

const STATIC_CACHE_NAME = "better-bench-static-v1";
const IMAGES_CACHE_NAME = "better-bench-images-v1";
const BENCHES_CACHE_NAME = "better-bench-data-v1";

const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icons/favicon.png",
  "/icons/logo-192.png",
  "/icons/logo-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  const currentCaches = [
    STATIC_CACHE_NAME,
    IMAGES_CACHE_NAME,
    BENCHES_CACHE_NAME,
  ];
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return cacheNames.filter(
          (cacheName) => !currentCaches.includes(cacheName)
        );
      })
      .then((cachesToDelete) => {
        return Promise.all(
          cachesToDelete.map((cacheToDelete) => {
            return caches.delete(cacheToDelete);
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache or network
self.addEventListener("fetch", (event) => {
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  if (
    event.request.url.includes("/firestore/") ||
    event.request.url.includes("/storage/")
  ) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          return caches.open(BENCHES_CACHE_NAME).then((cache) => {
            cache.put(event.request, response.clone());
            return response;
          });
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }

  // For image requests, use cache-first strategy
  if (event.request.destination === "image") {
    event.respondWith(
      caches.open(IMAGES_CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          return fetch(event.request).then((networkResponse) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        });
      })
    );
    return;
  }

  // For other requests, use network-first strategy
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        if (event.request.mode === "navigate") {
          return caches.match("/");
        }

        return null;
      });
    })
  );
});

self.addEventListener("sync", (event) => {
  if (event.tag === "sync-benches") {
    event.waitUntil(syncBenches());
  }
});

async function syncBenches() {
  const clients = await self.clients.matchAll();

  clients.forEach((client) => {
    client.postMessage({
      type: "SYNC_BENCHES",
    });
  });
}
