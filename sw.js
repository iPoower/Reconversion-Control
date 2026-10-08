const PREFIX = "reconversion-control-";
const BUILD = "__BUILD_SHA__";
const CACHE = PREFIX + (BUILD.indexOf("__") === 0 ? "dev" : BUILD.slice(0, 12));
const CORE = ["./", "./index.html", "./style.css", "./data.js", "./course-foundations.js", "./course-race.js", "./course-operations.js", "./learning.js", "./english.js", "./drive-learning.js", "./daily-five.js", "./deep-dives.js", "./evidence-checks.js", "./app.js", "./manifest.webmanifest", "./assets/icon-192.png", "./assets/icon-512.png"];
const BASE = new URL(self.registration.scope);
const INDEX = new URL("./index.html", BASE).href;
const ASSETS = new Set(CORE.map(function(path) { return new URL(path, BASE).pathname; }));

self.addEventListener("install", function(event) {
  event.waitUntil(caches.open(CACHE).then(function(cache) {
    // Une nouvelle version ne doit pas recopier un ancien HTTP cache Safari.
    return cache.addAll(CORE.map(function(path) {
      return new Request(new URL(path, BASE), { cache: "reload" });
    }));
  }).then(function() { return self.skipWaiting(); }));
});
self.addEventListener("activate", function(event) {
  event.waitUntil(caches.keys().then(function(keys) {
    // Les autres applications GitHub Pages partagent le même domaine.
    return Promise.all(keys.filter(function(key) {
      return key.startsWith(PREFIX) && key !== CACHE;
    }).map(function(key) { return caches.delete(key); }));
  }).then(function() { return self.clients.claim(); }));
});
self.addEventListener("fetch", function(event) {
  const request = event.request, url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== BASE.origin || !url.pathname.startsWith(BASE.pathname)) return;
  if (request.mode === "navigate") {
    event.respondWith(caches.open(CACHE).then(async function(cache) {
      try {
        const response = await fetch(new Request(request, { cache: "no-cache" }));
        if (response.ok) {
          if (url.pathname === BASE.pathname || url.pathname === new URL(INDEX).pathname) await cache.put(INDEX, response.clone());
          return response;
        }
        return await cache.match(INDEX) || response;
      } catch (error) {
        return await cache.match(INDEX) || Response.error();
      }
    }));
    return;
  }
  if (!ASSETS.has(url.pathname)) return;
  event.respondWith(caches.open(CACHE).then(async function(cache) {
    // Les paramètres de version ne font pas perdre les fichiers préchargés.
    const key = url.origin + url.pathname, cached = await cache.match(key);
    if (cached) return cached;
    const response = await fetch(request);
    if (response.ok) await cache.put(key, response.clone());
    return response;
  }));
});
