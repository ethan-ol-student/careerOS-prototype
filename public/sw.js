/*
 * Career OS service worker — deliberately MINIMAL (the deploy plan's own
 * backup scope: installability + shell caching, no offline-first app).
 *
 * - App shell + icons: cache-first (stable, versioned by CACHE name).
 * - Navigations: network-first, falling back to the cached shell so an
 *   installed app still opens offline.
 * - Everything else (API calls, auth, data): NETWORK ONLY — never cached,
 *   so no stale-session or stale-data bugs.
 */
const CACHE = "career-os-shell-v1";
const SHELL = ["/", "/icons/192", "/icons/512", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  // Data/auth stay network-only.
  if (url.pathname.startsWith("/api/")) return;

  // Static, hash-versioned assets + generated icons: cache-first.
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/")
  ) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(req, copy));
            return res;
          }),
      ),
    );
    return;
  }

  // Page navigations: network-first, cached shell as offline fallback.
  if (req.mode === "navigate") {
    event.respondWith(fetch(req).catch(() => caches.match("/")));
  }
});
