"use client";

// 公開サイト右カラム: ログインカード（モック）＋店舗情報カード。
import { useState } from "react";
import { Apple, Chrome, Lock, Mail } from "lucide-react";
import { useStoreSettings } from "@/features/master-data/store-settings";
import { initialStores } from "@/features/org/mock-data";
import { PM_NAVY } from "@/features/online-booking/public-shell";

const inputCls =
  "mt-1 flex w-full items-center gap-2 rounded-md border border-luxas-line bg-luxas-mist/40 px-3 py-2.5 text-sm text-luxas-ink focus-within:border-luxas-green";

// ログインカード（第1段は見た目のみのモック。実認証は第3段）。
export function LoginCard() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div id="login" className="space-y-4 scroll-mt-24">
      <section className="rounded-lg border border-luxas-line bg-white p-5">
        <h3 className="mb-4 text-base font-bold text-luxas-ink">ログイン</h3>
        <label className="block">
          <span className="text-xs font-medium text-stone-600">メールアドレス</span>
          <span className={inputCls}>
            <Mail size={16} className="shrink-0 text-stone-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="メールアドレス"
              className="w-full border-0 bg-transparent text-sm outline-none placeholder:text-stone-400"
            />
          </span>
        </label>
        <label className="mt-3 block">
          <span className="text-xs font-medium text-stone-600">パスワード</span>
          <span className={inputCls}>
            <Lock size={16} className="shrink-0 text-stone-400" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="パスワード"
              className="w-full border-0 bg-transparent text-sm outline-none placeholder:text-stone-400"
            />
          </span>
        </label>
        <button
          type="button"
          className="mt-4 w-full rounded-md py-2.5 text-sm font-semibold text-white"
          style={{ backgroundColor: PM_NAVY }}
        >
          ログイン
        </button>
        <p className="mt-3 text-center text-xs text-stone-500">パスワードを忘れた方はこちら</p>
      </section>

      <section className="rounded-lg border border-luxas-line bg-white p-5">
        <h3 className="mb-4 text-base font-bold text-luxas-ink">ソーシャルログイン</h3>
        <div className="space-y-2.5">
          <SocialButton icon={<Chrome size={18} className="text-stone-500" />} label="Googleでログイン" />
          <SocialButton icon={<Apple size={18} className="text-luxas-ink" />} label="Appleでログイン" />
          <SocialButton icon={<span className="text-sm font-bold text-green-600">E</span>} label="EPARKでログイン" />
        </div>
      </section>
    </div>
  );
}

function SocialButton({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      className="flex w-full items-center justify-center gap-3 rounded-md border border-luxas-line bg-white py-2.5 text-sm font-semibold text-luxas-ink hover:bg-luxas-mist/50"
    >
      <span className="flex h-5 w-5 items-center justify-center">{icon}</span>
      {label}
    </button>
  );
}

// 店舗情報カード（store-settings ＋ org 店舗名から表示）。
export function StoreInfoCard({ storeId }: { storeId: string }) {
  const [settings] = useStoreSettings();
  const store = initialStores.find((s) => s.id === storeId);

  const address = [settings.prefecture, settings.city, settings.address2].filter(Boolean).join("");
  const hours = `【営業時間】 ${settings.businessStartTime}〜${settings.businessEndTime} 【定休日】 ${settings.hpClosedDaysText || "なし"}`;

  const rows: { label: string; value: React.ReactNode }[] = [
    { label: "店舗名", value: store?.name ?? "LUXAS" },
    { label: "電話番号", value: settings.phone || "-" },
    { label: "住所", value: address || "-" },
    { label: "営業時間", value: hours },
    {
      label: "ホームページ",
      value: settings.hpUrl ? (
        <a href={settings.hpUrl} target="_blank" rel="noreferrer" className="text-luxas-green underline">
          {settings.hpUrl}
        </a>
      ) : (
        "-"
      )
    }
  ];

  return (
    <section className="rounded-lg border border-luxas-line bg-white p-5">
      <h3 className="mb-2 text-base font-bold text-luxas-ink">店舗情報</h3>
      <dl className="divide-y divide-luxas-line">
        {rows.map((r) => (
          <div key={r.label} className="grid grid-cols-[5.5rem_1fr] gap-3 py-3 text-sm">
            <dt className="text-stone-500">{r.label}</dt>
            <dd className="text-luxas-ink">{r.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
