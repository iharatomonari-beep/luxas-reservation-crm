"use client";

import { useRouter } from "next/navigation";
import { LogOut, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { ReactNode, useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
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
      <div className="flex min-h-screen">
        <Sidebar isOpen={isSidebarOpen} onNavigate={() => setIsSidebarOpen(false)} />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-luxas-line bg-white/92 backdrop-blur">
            <div className="flex min-h-16 items-center justify-between gap-3 px-4 md:px-6">
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-luxas-line text-luxas-ink md:hidden"
                onClick={() => setIsSidebarOpen((current) => !current)}
                aria-label={isSidebarOpen ? "メニューを閉じる" : "メニューを開く"}
              >
                {isSidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
              </button>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-luxas-ink">LUXAS予約・顧客管理</p>
                <p className="truncate text-xs text-stone-500">{userEmail}</p>
              </div>

              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-md border border-luxas-line bg-white px-3 py-2 text-sm font-medium text-luxas-ink transition hover:bg-luxas-mist"
                onClick={handleSignOut}
              >
                <LogOut size={16} aria-hidden="true" />
                <span className="hidden sm:inline">{isPreviewMode ? "ログインへ戻る" : "ログアウト"}</span>
              </button>
            </div>

            {isPreviewMode ? (
              <div className="border-t border-amber-200 bg-amber-50 px-4 py-2 text-xs leading-5 text-amber-900 md:px-6">
                Supabase環境変数が未設定のため、管理画面プレビューとして表示しています。
              </div>
            ) : null}
          </header>

          <main className="flex-1 px-4 py-6 md:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
