import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LUXAS予約・顧客管理",
  description: "LUXAS single store reservation and customer management prototype"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
