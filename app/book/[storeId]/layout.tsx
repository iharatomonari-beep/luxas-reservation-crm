import type { Metadata, Viewport } from "next";
import { PublicHeader } from "@/features/online-booking/public-shell";
import { PwaRegister } from "@/features/online-booking/pwa-client";

// PWA メタ情報（ホーム画面に追加したときのアプリ名・iOS対応・テーマ色）。
export const metadata: Metadata = {
  applicationName: "LUXAS予約",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "LUXAS予約" },
  icons: { icon: "/icon.svg", apple: "/icon.svg" }
};

export const viewport: Viewport = {
  themeColor: "#1f2a44"
};

// 公開予約サイトの外枠（PM相当）。共通ヘッダーを全ページに表示する。
export default async function BookLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  return (
    <div className="min-h-screen bg-luxas-paper">
      <PwaRegister />
      <PublicHeader storeId={storeId} />
      {children}
    </div>
  );
}
