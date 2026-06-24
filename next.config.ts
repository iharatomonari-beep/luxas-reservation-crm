import type { NextConfig } from "next";

// 全レスポンスに付与するセキュリティヘッダ。
// 注: スクリプトを制限する完全な Content-Security-Policy は Next のインラインスクリプトに
// nonce 配布（middleware）が必要なため、ここではアプリを壊さない確実なヘッダのみ設定する。
// クリックジャッキング対策の frame-ancestors は meta では設定できないためヘッダで付与する。
const securityHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
  // プロトタイプ/デモ公開を検索エンジンにインデックスさせない（実顧客データ前提の本番では方針見直し）。
  { key: "X-Robots-Tag", value: "noindex, nofollow" }
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders
      }
    ];
  }
};

export default nextConfig;
