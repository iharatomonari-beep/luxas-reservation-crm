import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// next で受け取った遷移先を、同一オリジンのアプリ内パスのみに制限する（オープンリダイレクト防止）。
// `//evil.com` や `/\evil.com` のようなプロトコル相対・バックスラッシュ経由の外部遷移を弾く（許可リスト方式）。
function resolveSafeNext(next: string, origin: string): string {
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return "/";
  }
  try {
    const resolved = new URL(next, origin);
    if (resolved.origin === origin) {
      return `${resolved.pathname}${resolved.search}${resolved.hash}`;
    }
  } catch {
    // 解析失敗時は安全側（トップ）へ。
  }
  return "/";
}

// ソーシャルログイン（Google/Apple 等）のOAuthリダイレクト先。
// 認可コードをセッションに交換し、検証済みの遷移先へ戻す。
// 失敗・未設定時はログインへ安全側で戻す（内部情報は返さない）。
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/";
  const safeNext = resolveSafeNext(next, origin);

  if (!code || !isSupabaseConfigured()) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    // 失敗時はセッション未確立。詳細はサーバーログのみ、利用者には一般的なエラーを示す。
    console.error("[auth/callback] exchangeCodeForSession failed");
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  return NextResponse.redirect(`${origin}${safeNext}`);
}
