const CACHE_NAME = "vocamira-shell-v6";
const APP_SHELL = [
  "./",
  "./index.html",
  "./pwa/offline.html",
  "./pwa/manifest.webmanifest",
  "./pages/sentences.html",
  "./assets/css/style.css",
  "./assets/css/nav.css",
  "./assets/css/home.css",
  "./assets/css/sentences.css",
  "./assets/js/nav.js",
  "./assets/js/home.js",
  "./assets/js/sentences.js",
  "./assets/images/favicon.svg",
  "./assets/images/vocamira-logo.svg",
  "./data/sentences.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const responseCopy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseCopy));
        }
        return response;
      })
      .catch(async () => {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) return cachedResponse;

        if (request.mode === "navigate") {
          return caches.match("./pwa/offline.html");
        }

        return Response.error();
      })
  );
});