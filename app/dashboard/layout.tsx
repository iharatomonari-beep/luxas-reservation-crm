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

  // 認証は fail-closed。Supabase 未設定のときは、開発環境(NODE_ENV!=="production")に限り
  // 無認証プレビューを許可し、本番では必ずログインへ送る（env注入漏れ等での管理画面全開放を防ぐ）。
  if (!configured) {
    if (process.env.NODE_ENV === "production") {
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

  return (
    <DashboardShell isPreviewMode={false} userEmail={user.email ?? "staff@luxas"}>
      {children}
    </DashboardShell>
  );
}
