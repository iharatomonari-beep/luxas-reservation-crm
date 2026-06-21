// LUXAS 予約 PWA の最小 Service Worker。
// インストール可能要件（manifest＋icons＋fetchハンドラ）を満たす。
// ネットワーク優先。ナビゲーションはオフライン時にキャッシュへフォールバック。
const CACHE = "luxas-book-v1";
const FALLBACK = "/book/store-shibuya";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match(FALLBACK)))
    );
  }
});
