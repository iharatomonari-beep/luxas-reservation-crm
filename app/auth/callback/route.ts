import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// ソーシャルログイン（Google/Apple 等）のOAuthリダイレクト先。
// 認可コードをセッションに交換し、next で指定された画面へ戻す。
// Supabase未設定時は何もせずトップへ戻す（実装は済・運用設定待ち）。
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/";

  if (code && isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  // next はアプリ内パスのみ許可（オープンリダイレクト防止）。
  const safeNext = next.startsWith("/") ? next : "/";
  return NextResponse.redirect(`${origin}${safeNext}`);
}
