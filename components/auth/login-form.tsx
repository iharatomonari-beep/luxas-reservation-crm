"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ArrowRight, LockKeyhole, Mail } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function LoginForm({
  isSupabaseConfigured
}: {
  isSupabaseConfigured: boolean;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!isSupabaseConfigured) {
      setError("Supabase環境変数を設定するとログインできます。");
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="rounded-lg border border-luxas-line bg-white p-6 shadow-soft md:p-8">
      <div className="mb-8">
        <p className="text-sm font-semibold text-luxas-green">Staff Login</p>
        <h2 className="mt-2 text-2xl font-semibold text-luxas-ink">管理画面にログイン</h2>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Supabase Authに登録したスタッフアカウントでログインします。
        </p>
      </div>

      {!isSupabaseConfigured ? (
        <div className="mb-5 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          `.env.local` に Supabase URL と anon key が未設定です。設定後に実ログインできます。
        </div>
      ) : null}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="text-sm font-medium text-stone-700">メールアドレス</span>
          <span className="mt-2 flex items-center gap-2 rounded-md border border-luxas-line bg-white px-3 py-2.5 focus-within:border-luxas-green">
            <Mail size={18} className="text-stone-400" aria-hidden="true" />
            <input
              className="w-full border-0 bg-transparent text-sm text-luxas-ink outline-none placeholder:text-stone-400"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="staff@example.com"
              required
            />
          </span>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-stone-700">パスワード</span>
          <span className="mt-2 flex items-center gap-2 rounded-md border border-luxas-line bg-white px-3 py-2.5 focus-within:border-luxas-green">
            <LockKeyhole size={18} className="text-stone-400" aria-hidden="true" />
            <input
              className="w-full border-0 bg-transparent text-sm text-luxas-ink outline-none placeholder:text-stone-400"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="password"
              required
            />
          </span>
        </label>

        {error ? <p className="text-sm text-red-700">{error}</p> : null}

        <button
          className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-luxas-green px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#285f51] disabled:cursor-not-allowed disabled:bg-stone-300"
          type="submit"
          disabled={isSubmitting || !isSupabaseConfigured}
        >
          {isSubmitting ? "確認中" : "ログイン"}
          <ArrowRight size={18} aria-hidden="true" />
        </button>
      </form>

      {/* Supabase 未設定（プロトタイプ/デモモード）では無認証プレビュー導線を表示する。
          NEXT_PUBLIC_LOCK_PREVIEW=1 でロックした場合は非表示。 */}
      {!isSupabaseConfigured && process.env.NEXT_PUBLIC_LOCK_PREVIEW !== "1" ? (
        <Link
          href="/dashboard"
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md border border-luxas-line bg-white px-4 py-3 text-sm font-semibold text-luxas-ink transition hover:bg-luxas-mist"
        >
          管理画面プレビューを開く（開発用）
          <ArrowRight size={18} aria-hidden="true" />
        </Link>
      ) : null}
    </section>
  );
}
