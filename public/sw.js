// LUXAS 予約 PWA の最小 Service Worker。
// インストール可能要件（manifest＋icons＋fetchハンドラ）を満たす。
// ネットワーク優先。ナビゲーションはオフライン時にキャッシュへフォールバック。
// v2: スコープを /book/ に限定した移行版。旧 v1（rootスコープで管理画面HTMLもキャッシュし得た）の
// キャッシュは activate 時に削除する。
const CACHE = "luxas-book-v2";
const FALLBACK = "/book/store-shibuya";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // 旧キャッシュ（v1 など現行 CACHE 以外）を削除する。
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)));
      await self.clients.claim();
    })()
  );
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
