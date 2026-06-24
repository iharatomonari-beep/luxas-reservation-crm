import type { MetadataRoute } from "next";

// プロトタイプ/デモ公開のためクロールを全面禁止する（検索エンジンに載せない）。
// 実顧客向けに公開予約サイトを正式公開する段階で、/book/ を allow にするなど方針を見直す。
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: "/"
    }
  };
}
