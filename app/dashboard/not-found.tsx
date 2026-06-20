import Link from "next/link";

// /dashboard 配下の未実装・存在しないページ用。DashboardShell（上部ナビ）内に描画されるため、
// ブラウザの戻る以外に、上部メニューやこのリンクからどこへでも移動できる。
export default function DashboardNotFound() {
  return (
    <div className="mx-auto max-w-lg rounded-lg border border-luxas-line bg-white px-6 py-10 text-center shadow-sm">
      <p className="text-sm font-medium text-luxas-green">準備中 / ページが見つかりません</p>
      <h1 className="mt-2 text-lg font-semibold text-luxas-ink">このページはまだ実装されていません</h1>
      <p className="mt-2 text-sm text-stone-600">
        上部メニューから他の画面へ移動できます。下のリンクからも戻れます。
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <Link href="/dashboard/reservations" className="rounded-md bg-luxas-green px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#285f51]">
          予約台帳へ
        </Link>
        <Link href="/dashboard" className="rounded-md border border-luxas-line bg-white px-4 py-2.5 text-sm font-semibold text-luxas-ink transition hover:bg-luxas-mist">
          トップへ
        </Link>
      </div>
    </div>
  );
}
