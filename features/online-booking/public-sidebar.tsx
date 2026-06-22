"use client";

// 公開サイト右カラム: ログイン/会員カード（モック）＋店舗情報カード。
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Apple, Chrome, Lock, Mail } from "lucide-react";
import { useStoreSettings } from "@/features/master-data/store-settings";
import { safeHttpUrl } from "@/features/master-data/utils";
import { useLocalCollection } from "@/features/master-data/local-storage";
import { initialStores } from "@/features/org/mock-data";
import { initialReservations, reservationsStorageKey } from "@/features/reservations/mock-data";
import { initialCustomers, customersStorageKey } from "@/features/customers/mock-data";
import type { Reservation } from "@/features/reservations/types";
import type { Customer } from "@/features/customers/types";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { PM_NAVY } from "@/features/online-booking/public-shell";
import { useMemberSession } from "@/features/online-booking/use-member-session";

// ソーシャルログイン/登録（Supabase Auth）。プロバイダ設定が済めばそのまま動く。
// 未設定の今は案内のみ（オンボーディングは管理者が Supabase 側で実施）。
export async function signInWithProvider(provider: "google" | "apple", storeId: string) {
  if (!isSupabaseConfigured()) {
    window.alert("ソーシャルログインは現在準備中です。管理者が連携設定を行うと利用できます。");
    return;
  }
  const supabase = createSupabaseBrowserClient();
  await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: `${window.location.origin}/auth/callback?next=/book/${storeId}/mypage` }
  });
}

const inputCls =
  "mt-1 flex w-full items-center gap-2 rounded-md border border-luxas-line bg-luxas-mist/40 px-3 py-2.5 text-sm text-luxas-ink focus-within:border-luxas-green";

// ログインカード（第2段はデモ・ログイン。実認証は第3段）。
// ログインボタンで「登録済みのお客様」としてマイページに入る（モック）。
export function LoginCard({ storeId }: { storeId: string }) {
  const router = useRouter();
  const { memberId, login, logout } = useMemberSession();
  const [reservations] = useLocalCollection<Reservation>(reservationsStorageKey, initialReservations);
  const [customers] = useLocalCollection<Customer>(customersStorageKey, initialCustomers);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const member = customers.find((c) => c.id === memberId) ?? null;

  // デモ: 直近のオンライン予約の顧客 → 無ければ最初の顧客 をログイン会員とする。
  function pickDemoMemberId(): string {
    const fromReservation = reservations.find((r) => r.source === "online" && r.customerId)?.customerId;
    if (fromReservation) return fromReservation;
    return customers[0]?.id ?? "";
  }

  function handleLogin() {
    const id = pickDemoMemberId();
    if (!id) return;
    login(id);
    router.push(`/book/${storeId}/mypage`);
  }

  // ログイン中は会員パネルを表示（全画面でログイン状態を連動させる）。
  if (memberId && member) {
    return (
      <section className="rounded-lg border border-luxas-line bg-white p-5">
        <p className="text-xs text-stone-500">ログイン中</p>
        <p className="mt-1 text-base font-bold text-luxas-ink">{member.name} さん</p>
        <div className="mt-4 space-y-2.5">
          <Link
            href={`/book/${storeId}/mypage`}
            className="block rounded-md py-2.5 text-center text-sm font-semibold text-white"
            style={{ backgroundColor: PM_NAVY }}
          >
            マイページ
          </Link>
          <Link
            href={`/book/${storeId}/mypage/reservations`}
            className="block rounded-md border border-luxas-line py-2.5 text-center text-sm font-semibold text-luxas-ink hover:bg-luxas-mist/50"
          >
            予約情報
          </Link>
        </div>
        <button
          type="button"
          onClick={() => logout()}
          className="mt-3 w-full py-2 text-center text-sm font-medium text-stone-500 hover:text-luxas-ink"
        >
          ログアウト
        </button>
      </section>
    );
  }

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
          onClick={handleLogin}
          className="mt-4 w-full rounded-md py-2.5 text-sm font-semibold text-white"
          style={{ backgroundColor: PM_NAVY }}
        >
          ログイン
        </button>
        <p className="mt-3 text-center text-xs text-stone-500">パスワードを忘れた方はこちら</p>
        <p className="mt-1 text-center text-[10px] text-stone-400">（デモ：登録済みのお客様としてマイページに入ります）</p>
      </section>

      <section className="rounded-lg border border-luxas-line bg-white p-5">
        <h3 className="mb-4 text-base font-bold text-luxas-ink">ソーシャルログイン</h3>
        <div className="space-y-2.5">
          <SocialButton
            icon={<Chrome size={18} className="text-stone-500" />}
            label="Googleでログイン"
            onClick={() => signInWithProvider("google", storeId)}
          />
          <SocialButton
            icon={<Apple size={18} className="text-luxas-ink" />}
            label="Appleでログイン"
            onClick={() => signInWithProvider("apple", storeId)}
          />
          <SocialButton
            icon={<span className="text-sm font-bold text-green-600">E</span>}
            label="EPARKでログイン"
            onClick={() => window.alert("EPARK連携は準備中です。")}
          />
        </div>
      </section>
    </div>
  );
}

function SocialButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center gap-3 rounded-md border border-luxas-line bg-white py-2.5 text-sm font-semibold text-luxas-ink hover:bg-luxas-mist/50"
    >
      <span className="flex h-5 w-5 items-center justify-center">{icon}</span>
      {label}
    </button>
  );
}

// 店舗情報カード（store-settings ＋ org 店舗名から表示）。
export function StoreInfoCard({ storeId }: { storeId: string }) {
  const [settings] = useStoreSettings(storeId);
  const store = initialStores.find((s) => s.id === storeId);

  const address = [settings.prefecture, settings.city, settings.address2].filter(Boolean).join("");
  // 店舗設定のHP URLは http(s) のみ許可（javascript: 等のスキームXSSを防ぐ）。
  const safeHpUrl = safeHttpUrl(settings.hpUrl);

  const rows: { label: string; value: React.ReactNode }[] = [
    { label: "店舗名", value: store?.name ?? "LUXAS" },
    { label: "電話番号", value: settings.phone || "-" },
    ...(settings.email ? [{ label: "メール", value: settings.email }] : []),
    { label: "住所", value: address || "-" },
    { label: "営業時間", value: `${settings.businessStartTime}〜${settings.businessEndTime}` },
    { label: "予約受付", value: `〜${settings.reservationAcceptEndTime || settings.businessEndTime}` },
    { label: "定休日", value: settings.hpClosedDaysText || "なし" },
    {
      label: "ホームページ",
      value: safeHpUrl ? (
        <a href={safeHpUrl} target="_blank" rel="noreferrer noopener" className="text-luxas-green underline">
          {safeHpUrl}
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
