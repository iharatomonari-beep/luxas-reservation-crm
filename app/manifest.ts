import type { MetadataRoute } from "next";

// PWA マニフェスト（公開予約サイト /book/ をホーム画面に追加できるようにする）。
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LUXAS オンライン予約",
    short_name: "LUXAS予約",
    description: "LUXAS の予約・メニュー・店舗情報",
    start_url: "/book/store-shibuya",
    scope: "/book/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fbfaf7",
    theme_color: "#1f2a44",
    lang: "ja",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon-maskable.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" }
    ]
  };
}
