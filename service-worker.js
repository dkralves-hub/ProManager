const CACHE_NAME = "promanager-v1";

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./Manager_v2_0_Fase0_Online.html",
  "./manifest.json",
  "./service-worker.js"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(FILES_TO_CACHE))
  );

  self.skipWaiting();
});


self.addEventListener("activate", event => {

  event.waitUntil(
    caches.keys().then(cacheNames => {

      return Promise.all(
        cacheNames.map(cacheName => {

          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }

        })

      );

    })
  );

  self.clients.claim();

});


self.addEventListener("fetch", event => {

  event.respondWith(
    caches.match(event.request)
      .then(response => {

        return response || fetch(event.request);

      })
  );

});
