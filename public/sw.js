// Orbit Watch service worker — free, client-side offline support.
// Strategy:
//  - The HTML app shell (the page itself): network-first. This is the part
//    that changes on every deploy, so it must never be served stale — if
//    it were cache-first, a bug shipped once would keep getting served to
//    returning visitors forever, even after being fixed. Falls back to the
//    cached copy only if the network is genuinely unavailable.
//  - Static assets (icons, manifest): cache-first, since those rarely change.
//  - /api/tle (the satellite data): network-first, falling back to the last
//    successful response if CelesTrak/the network is unavailable.
//
// CACHE VERSION: bump this (v1 -> v2 -> ...) any time the caching strategy
// itself changes, so old/bad caches from previous versions get discarded.
const SHELL_CACHE = "orbitwatch-shell-v2";
const DATA_CACHE = "orbitwatch-data-v2";

const STATIC_ASSETS = [
  "/site.webmanifest",
  "/icon-192.png",
  "/icon-512.png",
  "/favicon-32.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(STATIC_ASSETS)).catch(() => {})
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

  // HTML navigation (the app itself): network-first, always prefer the
  // latest deploy. Only fall back to cache if there's truly no connection.
  if (request.mode === "navigate" || request.destination === "document") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const clone = res.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put(request, clone));
          return res;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match("/")))
    );
    return;
  }

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

  // Static assets: cache-first, network fallback.
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request)
          .then((res) => {
            if (res.ok) {
              const clone = res.clone();
              caches.open(SHELL_CACHE).then((cache) => cache.put(request, clone));
            }
            return res;
          })
          .catch(() => undefined);
      })
    );
  }
});

