// Orbit Watch service worker — free, client-side offline support.
// Strategy:
//  - App shell (the page itself, icons, manifest): cache-first, so the app
//    still opens with no connection.
//  - /api/tle (the satellite data): network-first, falling back to the last
//    successful response if CelesTrak/the network is unavailable. This is
//    the "Celestrak downtime fallback" from the roadmap, done for free with
//    no extra backend.
const SHELL_CACHE = "orbitwatch-shell-v1";
const DATA_CACHE = "orbitwatch-data-v1";

const SHELL_ASSETS = [
  "/",
  "/site.webmanifest",
  "/icon-192.png",
  "/icon-512.png",
  "/favicon-32.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== SHELL_CACHE && k !== DATA_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // TLE data: network-first, cache the good response, serve cached on failure.
  if (url.pathname === "/api/tle") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(DATA_CACHE).then((cache) => cache.put(request, clone));
          }
          return res;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Same-origin navigation/app-shell requests: cache-first, network fallback.
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request)
          .then((res) => {
            if (res.ok && (request.destination === "" || request.destination === "document")) {
              const clone = res.clone();
              caches.open(SHELL_CACHE).then((cache) => cache.put(request, clone));
            }
            return res;
          })
          .catch(() => caches.match("/"));
      })
    );
  }
});
