const CACHE_NAME = "vocamira-shell-v4";
const APP_SHELL = [
  "./",
  "./index.html",
  "./offline.html",
  "./manifest.webmanifest",
  "./Pages/sentences.html",
  "./Pages/admin-sentences.html",
  "./assets/css/style.css",
  "./assets/css/nav.css",
  "./assets/css/home.css",
  "./assets/css/sentences.css",
  "./assets/css/admin.css",
  "./assets/js/nav.js",
  "./assets/js/home.js",
  "./assets/js/supabase.js",
  "./assets/js/sentences.js",
  "./assets/js/admin-sentences.js",
  "./assets/images/favicon.svg",
  "./assets/images/vocamira-logo.svg",
  "./data/sentences.json"
];
self.addEventListener("install",event=>{event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(APP_SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",event=>{event.waitUntil(caches.keys().then(names=>Promise.all(names.filter(name=>name!==CACHE_NAME).map(name=>caches.delete(name)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",event=>{const request=event.request;const url=new URL(request.url);if(request.method!=="GET"||url.origin!==self.location.origin)return;if(request.mode==="navigate"){event.respondWith(fetch(request).then(response=>{const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(request,copy));return response}).catch(async()=>await caches.match(request)||caches.match("./offline.html")));return}event.respondWith(caches.match(request).then(cached=>{const network=fetch(request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(request,copy))}return response}).catch(()=>cached);return cached||network}))});