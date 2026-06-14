import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function LoginPage() {
  const configured = isSupabaseConfigured();

  if (configured) {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (user) {
      redirect("/dashboard");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="flex flex-col justify-between rounded-lg border border-luxas-line bg-white p-8 shadow-soft">
          <div>
            <p className="text-sm font-semibold text-luxas-green">LUXAS v0.1 Prototype</p>
            <h1 className="mt-4 text-3xl font-semibold tracking-normal text-luxas-ink">
              予約と顧客対応の入口をひとつに。
            </h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-stone-600">
              Day 1ではスタッフログイン、管理画面レイアウト、Supabase接続準備までを確認します。
            </p>
          </div>

          <dl className="mt-10 grid gap-3 text-sm text-stone-700">
            <div className="flex items-center justify-between border-t border-luxas-line pt-3">
              <dt>店舗</dt>
              <dd className="font-medium text-luxas-ink">LUXAS single store</dd>
            </div>
            <div className="flex items-center justify-between border-t border-luxas-line pt-3">
              <dt>認証</dt>
              <dd className="font-medium text-luxas-ink">Supabase Auth</dd>
            </div>
            <div className="flex items-center justify-between border-t border-luxas-line pt-3">
              <dt>公開</dt>
              <dd className="font-medium text-luxas-ink">Vercel想定</dd>
            </div>
          </dl>
        </section>

        <LoginForm isSupabaseConfigured={configured} />
      </div>
    </main>
  );
}
