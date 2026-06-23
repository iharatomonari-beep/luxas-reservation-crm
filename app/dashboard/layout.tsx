import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const configured = isSupabaseConfigured();

  // 認証は既定 fail-closed。Supabase 未設定のとき無認証プレビューを許可するのは、
  //  (a) 開発環境(NODE_ENV!=="production")、または
  //  (b) 明示的に NEXT_PUBLIC_ALLOW_PREVIEW="1" を設定したデプロイ（チームによる動作確認用）
  // のみ。既定（フラグ未設定の本番）は必ずログインへ送る。
  // ⚠ NEXT_PUBLIC_ALLOW_PREVIEW=1 のデプロイは URL を知る誰でも管理画面を閲覧できる。
  //    実顧客データを入れる前に必ず外すこと（現状はモックデータのため確認用に許容）。
  const previewAllowed =
    process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_ALLOW_PREVIEW === "1";

  if (!configured) {
    if (!previewAllowed) {
      redirect("/login");
    }

    return (
      <DashboardShell isPreviewMode userEmail="preview@luxas.local">
        {children}
      </DashboardShell>
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 認可（認証だけでは不十分）。公開予約サイトと同じ Supabase Auth を共有するため、
  // 認証済みでも顧客アカウントが管理画面に入れてしまう（権限昇格）。スタッフ/管理者のみ許可する。
  // 暫定方式: サーバー専用の許可リスト STAFF_EMAIL_ALLOWLIST（カンマ区切り・NEXT_PUBLIC不可）。
  // 恒久対応は users/user_roles を参照する RBAC（DB・RLS 構築後）。許可リスト未設定の本番は fail-closed。
  const allowlist = (process.env.STAFF_EMAIL_ALLOWLIST ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
  const email = (user.email ?? "").toLowerCase();

  if (allowlist.length > 0) {
    if (!email || !allowlist.includes(email)) {
      redirect("/login?error=forbidden");
    }
  } else if (process.env.NODE_ENV === "production") {
    // 本番で許可リスト未設定＝全認証ユーザーが管理画面に入れる危険な状態。安全側で拒否する。
    console.error("[dashboard] STAFF_EMAIL_ALLOWLIST が未設定のため管理画面アクセスを拒否しました。");
    redirect("/login?error=forbidden");
  }

  return (
    <DashboardShell isPreviewMode={false} userEmail={user.email ?? "staff@luxas"}>
      {children}
    </DashboardShell>
  );
}
