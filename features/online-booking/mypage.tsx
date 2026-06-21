"use client";

// 公開サイト マイページ（PMの /mypage 相当）。第2段はデモ会員での表示。
// ホーム / 予約情報 / 会員情報 の3タブ＋右にマイページメニュー。
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { useLocalCollection } from "@/features/master-data/local-storage";
import { initialServices, initialStaff, servicesStorageKey, staffStorageKey } from "@/features/master-data/mock-data";
import { initialReservations, reservationsStorageKey } from "@/features/reservations/mock-data";
import { initialCustomers, customersStorageKey } from "@/features/customers/mock-data";
import type { ServiceMenu, StaffMember } from "@/features/master-data/types";
import type { Reservation } from "@/features/reservations/types";
import type { Customer } from "@/features/customers/types";
import { formatCurrency } from "@/features/master-data/utils";
import { PM_NAVY } from "@/features/online-booking/public-shell";
import { LoginCard } from "@/features/online-booking/public-sidebar";
import { useMemberSession } from "@/features/online-booking/use-member-session";

type Tab = "home" | "reservations" | "member";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

function formatJpDateTime(date: string, time: string): string {
  const d = new Date(`${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return `${date} ${time}`;
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${WEEKDAYS[d.getDay()]}） ${time}`;
}

function formatJpDate(date: string): string {
  const d = new Date(`${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return date || "-";
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

function statusInfo(r: Reservation): { label: string; cls: string } {
  if (r.status === "canceled") return { label: "取消済み", cls: "bg-stone-400" };
  if (r.status === "completed") return { label: "完了", cls: "bg-luxas-green" };
  return { label: "予約中", cls: "bg-[#1f2a44]" };
}

// マイページで使う共通データ＋セッションを読み出す。
function useMyPageData() {
  const { memberId, hydrated, logout } = useMemberSession();
  const [reservations, setReservations] = useLocalCollection<Reservation>(reservationsStorageKey, initialReservations);
  const [customers] = useLocalCollection<Customer>(customersStorageKey, initialCustomers);
  const [services] = useLocalCollection<ServiceMenu>(servicesStorageKey, initialServices);
  const [staff] = useLocalCollection<StaffMember>(staffStorageKey, initialStaff);

  const member = useMemo(() => customers.find((c) => c.id === memberId) ?? null, [customers, memberId]);

  const myReservations = useMemo(() => {
    if (!memberId) return [];
    return reservations
      .filter((r) => r.customerId === memberId)
      .slice()
      .sort((a, b) => `${b.date}${b.startTime}`.localeCompare(`${a.date}${a.startTime}`));
  }, [reservations, memberId]);

  // お客様によるキャンセル（取消）。台帳・集計と同じ canceled / cancelType=cancel を使う。
  function cancelReservation(id: string) {
    setReservations((cur) =>
      cur.map((r) =>
        r.id === id
          ? { ...r, status: "canceled", cancelType: "cancel", canceledAt: new Date().toISOString() }
          : r
      )
    );
  }

  return { memberId, hydrated, logout, member, myReservations, services, staff, cancelReservation };
}

// ── 共通レイアウト（タブ＋右メニュー）。未ログインはログイン誘導。 ─────────────
function MyPageShell({
  storeId,
  tab,
  children
}: {
  storeId: string;
  tab: Tab;
  children: React.ReactNode;
}) {
  const { memberId, hydrated, logout } = useMemberSession();
  const router = useRouter();
  const base = `/book/${storeId}/mypage`;

  if (hydrated && !memberId) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <section className="rounded-lg border border-luxas-line bg-white p-6">
            <h1 className="text-lg font-bold text-luxas-ink">マイページ</h1>
            <p className="mt-2 text-sm text-stone-600">マイページのご利用にはログインが必要です。右のフォームからログインしてください。</p>
          </section>
          <aside>
            <LoginCard storeId={storeId} />
          </aside>
        </div>
      </main>
    );
  }

  const tabs: { key: Tab; label: string; href: string }[] = [
    { key: "home", label: "ホーム", href: base },
    { key: "reservations", label: "予約情報", href: `${base}/reservations` },
    { key: "member", label: "会員情報", href: `${base}/member` }
  ];

  function handleLogout() {
    logout();
    router.push(`/book/${storeId}`);
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <nav className="mb-4 flex gap-5 border-b border-luxas-line">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={t.href}
            className={[
              "-mb-px border-b-2 pb-2 text-sm font-medium",
              t.key === tab ? "border-luxas-ink text-luxas-ink" : "border-transparent text-stone-400 hover:text-stone-600"
            ].join(" ")}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">{children}</div>
        <aside>
          <section className="rounded-lg border border-luxas-line bg-white p-5">
            <h3 className="mb-4 text-base font-bold text-luxas-ink">マイページ</h3>
            <div className="space-y-2.5">
              <MenuLink href={base} label="マイページ" />
              <MenuLink href={`${base}/reservations`} label="予約情報" />
              <MenuLink href={`${base}/member`} label="会員情報" />
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="mt-3 w-full py-2 text-center text-sm font-medium text-stone-500 hover:text-luxas-ink"
            >
              ログアウト
            </button>
          </section>
        </aside>
      </div>
    </main>
  );
}

function MenuLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="block rounded-md py-2.5 text-center text-sm font-semibold text-white"
      style={{ backgroundColor: PM_NAVY }}
    >
      {label}
    </Link>
  );
}

// ── 予約カード ────────────────────────────────────────────────
function ReservationCard({
  r,
  services,
  staff,
  onCancel,
  onChange
}: {
  r: Reservation;
  services: ServiceMenu[];
  staff: StaffMember[];
  onCancel?: (id: string) => void;
  onChange?: (id: string) => void;
}) {
  const menu = services.find((m) => m.id === r.serviceMenuId);
  const assignedName = staff.find((s) => s.id === r.staffId)?.displayName ?? "スタッフ";
  const total = r.saleAmount ?? menu?.price ?? 0;
  const st = statusInfo(r);
  // 予約中（booked）の予約は、お客様が変更/キャンセルできる。完了/取消済みは不可。
  const cancelable = r.status === "booked";

  return (
    <div className="rounded-lg border border-luxas-line bg-white">
      <div className="flex items-center gap-3 border-b border-luxas-line px-5 py-4">
        <span className={["rounded-md px-2.5 py-1 text-xs font-semibold text-white", st.cls].join(" ")}>{st.label}</span>
        <span className="text-base font-bold text-luxas-ink">{formatJpDateTime(r.date, r.startTime)}</span>
      </div>
      <dl className="divide-y divide-luxas-line px-5">
        <Row label="メニュー" value={menu?.name ?? "-"} />
        <Row label="スタッフ" value={`${assignedName}${r.nominatedStaffId ? "（指名）" : ""}`} />
        <Row label="合計" value={formatCurrency(total)} />
      </dl>
      {cancelable && (onCancel || onChange) && (
        <div className="flex gap-2 border-t border-luxas-line px-5 py-3">
          {onChange && (
            <button
              type="button"
              onClick={() => onChange(r.id)}
              className="flex-1 rounded-md py-2 text-sm font-semibold text-white"
              style={{ backgroundColor: PM_NAVY }}
            >
              日時を変更
            </button>
          )}
          {onCancel && (
            <button
              type="button"
              onClick={() => onCancel(r.id)}
              className="flex-1 rounded-md border border-red-300 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
            >
              キャンセル
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[5rem_1fr] gap-3 py-3.5 text-sm">
      <dt className="text-stone-500">{label}</dt>
      <dd className="text-luxas-ink">{value}</dd>
    </div>
  );
}

// 予約のキャンセル/変更ハンドラ（確認ダイアログ付き）を組み立てる。
// cancelReservation は呼び出し側の useMyPageData から受け取る（state を二重に持たない）。
function useReservationActions(storeId: string, cancelReservation: (id: string) => void) {
  const router = useRouter();
  function onCancel(id: string) {
    if (window.confirm("この予約をキャンセルします。よろしいですか？")) cancelReservation(id);
  }
  function onChange(id: string) {
    if (window.confirm("現在の予約をキャンセルして、新しく予約し直します。よろしいですか？")) {
      cancelReservation(id);
      router.push(`/book/${storeId}/reserve`);
    }
  }
  return { onCancel, onChange };
}

// ── ① マイページ ホーム ───────────────────────────────────────
export function MyPageHome({ storeId }: { storeId: string }) {
  const { member, myReservations, services, staff, cancelReservation } = useMyPageData();
  const { onCancel, onChange } = useReservationActions(storeId, cancelReservation);
  const upcoming = myReservations.filter((r) => r.status !== "canceled");

  return (
    <MyPageShell storeId={storeId} tab="home">
      <section className="rounded-lg border border-luxas-line bg-white p-5">
        <h2 className="mb-3 text-base font-bold text-luxas-ink">予約情報</h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-stone-500">現在、予約はありません。</p>
        ) : (
          <div className="space-y-3">
            <ReservationCard r={upcoming[0]} services={services} staff={staff} onCancel={onCancel} onChange={onChange} />
          </div>
        )}
        <Link href={`/book/${storeId}/mypage/reservations`} className="mt-4 block rounded-md py-2.5 text-center text-sm font-semibold text-white" style={{ backgroundColor: PM_NAVY }}>
          予約情報
        </Link>
      </section>

      <section className="rounded-lg border border-luxas-line bg-white p-5">
        <h2 className="mb-3 text-base font-bold text-luxas-ink">会員情報</h2>
        <dl className="divide-y divide-luxas-line">
          <Row label="お名前" value={member?.name || "-"} />
          <Row label="電話番号" value={member?.phone || "-"} />
          <Row label="誕生日" value={member?.birthDate ? formatJpDate(member.birthDate) : "-"} />
        </dl>
        <Link href={`/book/${storeId}/mypage/member`} className="mt-4 block rounded-md py-2.5 text-center text-sm font-semibold text-white" style={{ backgroundColor: PM_NAVY }}>
          会員情報
        </Link>
      </section>
    </MyPageShell>
  );
}

// ── ② 予約情報 ────────────────────────────────────────────────
export function MyPageReservations({ storeId }: { storeId: string }) {
  const { myReservations, services, staff, cancelReservation } = useMyPageData();
  const { onCancel, onChange } = useReservationActions(storeId, cancelReservation);

  return (
    <MyPageShell storeId={storeId} tab="reservations">
      {myReservations.length === 0 ? (
        <section className="rounded-lg border border-luxas-line bg-white p-5">
          <p className="text-sm text-stone-500">現在、予約はありません。</p>
        </section>
      ) : (
        myReservations.map((r) => (
          <ReservationCard key={r.id} r={r} services={services} staff={staff} onCancel={onCancel} onChange={onChange} />
        ))
      )}
    </MyPageShell>
  );
}

// ── ③ 会員情報 ────────────────────────────────────────────────
export function MyPageMember({ storeId }: { storeId: string }) {
  const { member } = useMyPageData();

  return (
    <MyPageShell storeId={storeId} tab="member">
      <section className="rounded-lg border border-luxas-line bg-white p-5">
        <h2 className="mb-3 text-base font-bold text-luxas-ink">会員情報</h2>
        <dl className="divide-y divide-luxas-line">
          <Row label="お名前" value={member?.name || "-"} />
          <Row label="電話番号" value={member?.phone || "-"} />
          <Row label="誕生日" value={member?.birthDate ? formatJpDate(member.birthDate) : "-"} />
        </dl>
        <MockButton label="変更" />
      </section>

      <section className="rounded-lg border border-luxas-line bg-white p-5">
        <h2 className="mb-3 text-base font-bold text-luxas-ink">メールマガジン</h2>
        <dl className="divide-y divide-luxas-line">
          <Row label="重要なお知らせ" value={member?.acceptsEmail === false ? "受け取らない" : "受け取り"} />
          <Row label="店舗メールマガジン" value={member?.acceptsDm ? "受け取り" : "受け取らない"} />
        </dl>
        <MockButton label="変更" />
      </section>

      <section className="rounded-lg border border-luxas-line bg-white p-5">
        <h2 className="mb-3 text-base font-bold text-luxas-ink">アカウント情報</h2>
        <dl className="divide-y divide-luxas-line">
          <Row label="メールアドレス" value={member?.email || "-"} />
          <Row label="パスワード" value="********" />
        </dl>
        <div className="mt-4 flex justify-center gap-2">
          <MockButton label="メールアドレス変更" inline />
          <MockButton label="パスワード変更" inline />
        </div>
      </section>
    </MyPageShell>
  );
}

function MockButton({ label, inline }: { label: string; inline?: boolean }) {
  return (
    <div className={inline ? "" : "mt-4 flex justify-center"}>
      <button
        type="button"
        className="rounded-md px-6 py-2.5 text-sm font-semibold text-white"
        style={{ backgroundColor: PM_NAVY }}
      >
        {label}
      </button>
    </div>
  );
}
