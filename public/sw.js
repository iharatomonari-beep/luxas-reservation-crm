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
  if (request.mode !== "navigate") return;

  // 公開予約サイト(/book/)配下のナビゲーションのみをキャッシュ対象にする。
  // 管理画面(/dashboard)や会員ページ(/book/*/mypage)の認証済み/個人情報HTMLはキャッシュしない。
  const url = new URL(request.url);
  const inScope =
    url.origin === self.location.origin &&
    url.pathname.startsWith("/book/") &&
    !url.pathname.includes("/mypage");
  if (!inScope) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match(FALLBACK)))
  );
});
