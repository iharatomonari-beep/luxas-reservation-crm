"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

// 許可外ユーザー（スタッフ/管理者でない）が管理画面にアクセスしたときの案内。
// リダイレクトループを防ぐため、ここでは /dashboard へ自動遷移させず、
// 別アカウントでログインし直せるようサインアウト導線を出す。
export function ForbiddenNotice() {
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
    } finally {
      // サインアウト後はログインページを再読込（user が消えフォームが使える）。
      window.location.href = "/login";
    }
  }

  return (
    <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <p className="font-semibold">この画面を表示する権限がありません。</p>
      <p className="mt-1 text-xs leading-5">
        管理画面はスタッフ／管理者アカウントのみ利用できます。別のアカウントでログインし直してください。
      </p>
      <button
        type="button"
        onClick={handleSignOut}
        disabled={signingOut}
        className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-amber-400 bg-white px-3 py-2 text-xs font-semibold text-amber-900 transition hover:bg-amber-100 disabled:opacity-50"
      >
        <LogOut size={14} aria-hidden="true" />
        {signingOut ? "ログアウト中" : "ログアウトして別アカウントでログイン"}
      </button>
    </div>
  );
}
