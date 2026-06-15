"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Menu, X } from "lucide-react";
import { ReactNode, useState } from "react";
import { TopMenu } from "@/components/layout/top-menu";
import { StoreSwitcher } from "@/components/layout/store-switcher";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function DashboardShell({
  children,
  isPreviewMode,
  userEmail
}: {
  children: ReactNode;
  isPreviewMode: boolean;
  userEmail: string;
}) {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  async function handleSignOut() {
    if (!isPreviewMode) {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
    }

    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-luxas-paper">
      <header className="sticky top-0 z-20 border-b border-luxas-line bg-white/92 backdrop-blur">
        <div className="flex min-h-14 items-center gap-3 px-4 md:px-6">
          {/* モバイル用ハンバーガー */}
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-luxas-line text-luxas-ink md:hidden"
            onClick={() => setIsSidebarOpen((current) => !current)}
            aria-label={isSidebarOpen ? "メニューを閉じる" : "メニューを開く"}
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <Link href="/dashboard" className="shrink-0 text-base font-bold tracking-tight text-luxas-ink">
            LUXAS
          </Link>

          {/* PC: メニューバー（横並び・ヘッダー内に表示） */}
          <div className="min-w-0 flex-1">
            <TopMenu mobileOpen={false} onNavigate={() => setIsSidebarOpen(false)} />
          </div>

          <StoreSwitcher />

          <p className="hidden truncate text-xs text-stone-500 lg:block">{userEmail}</p>
          <button
            type="button"
            className="inline-flex shrink-0 items-center gap-2 rounded-md border border-luxas-line bg-white px-3 py-2 text-sm font-medium text-luxas-ink transition hover:bg-luxas-mist"
            onClick={handleSignOut}
          >
            <LogOut size={16} aria-hidden="true" />
            <span className="hidden sm:inline">{isPreviewMode ? "ログインへ戻る" : "ログアウト"}</span>
          </button>
        </div>

        {/* モバイル: ハンバーガーで開く縦アコーディオン（ヘッダー行の下に全幅表示） */}
        {isSidebarOpen ? (
          <TopMenu mobileOpen onNavigate={() => setIsSidebarOpen(false)} />
        ) : null}

        {isPreviewMode ? (
          <div className="border-t border-amber-200 bg-amber-50 px-4 py-2 text-xs leading-5 text-amber-900 md:px-6">
            Supabase環境変数が未設定のため、管理画面プレビューとして表示しています。
          </div>
        ) : null}
      </header>

      <main className="px-4 py-6 md:px-6 lg:px-8">{children}</main>
    </div>
  );
}
