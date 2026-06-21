"use client";

// 公開サイト マイページ（PMの /mypage 相当）。第2段はデモ会員での表示。
// ホーム / 予約情報 / 会員情報 の3タブ＋右にマイページメニュー。
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useLocalCollection } from "@/features/master-data/local-storage";
import { initialServices, initialStaff, servicesStorageKey, staffStorageKey } from "@/features/master-data/mock-data";
import { initialReservations, reservationsStorageKey } from "@/features/reservations/mock-data";
import { initialCustomers, customersStorageKey } from "@/features/customers/mock-data";
import type { ServiceMenu, StaffMember } from "@/features/master-data/types";
import type { Reservation } from "@/features/reservations/types";
import type { Customer } from "@/features/customers/types";
import { formatCurrency } from "@/features/master-data/utils";
import { initialStores } from "@/features/org/mock-data";
import { buildReservationEmail } from "@/features/online-booking/confirmation-email";
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
  const [customers, setCustomers] = useLocalCollection<Customer>(customersStorageKey, initialCustomers);
  const [services] = useLocalCollection<ServiceMenu>(servicesStorageKey, initialServices);
  const [staff] = useLocalCollection<StaffMember>(staffStorageKey, initialStaff);

  const member = useMemo(() => customers.find((c) => c.id === memberId) ?? null, [customers, memberId]);

  const myReservations = useMemo(() => {
    if (!memberId) return [];
    // 現在日時を基準に「これから来る予約（直近が最上）」→「過去の予約（新しい順）」の並びにする。
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const nowKey = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const key = (r: Reservation) => `${r.date}${r.startTime ?? "00:00"}`;
    const isUpcoming = (r: Reservation) => key(r) >= nowKey;
    return reservations
      .filter((r) => r.customerId === memberId)
      .slice()
      .sort((a, b) => {
        const ua = isUpcoming(a);
        const ub = isUpcoming(b);
        if (ua !== ub) return ua ? -1 : 1; // これから来る予約を先に
        // 未来は近い順（昇順）＝次の予約が最上、過去は新しい順（降順）。
        return ua ? key(a).localeCompare(key(b)) : key(b).localeCompare(key(a));
      });
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

  // 会員情報の実保存（localStorage の customers を更新）。ログイン中の会員のみ対象。
  function updateMember(patch: Partial<Customer>) {
    if (!memberId) return;
    setCustomers((cur) => cur.map((c) => (c.id === memberId ? { ...c, ...patch } : c)));
  }

  return { memberId, hydrated, logout, member, myReservations, services, staff, cancelReservation, updateMember };
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
  onCancel?: (r: Reservation) => void;
  onChange?: (r: Reservation) => void;
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
              onClick={() => onChange(r)}
              className="flex-1 rounded-md py-2 text-sm font-semibold text-white"
              style={{ backgroundColor: PM_NAVY }}
            >
              日時を変更
            </button>
          )}
          {onCancel && (
            <button
              type="button"
              onClick={() => onCancel(r)}
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
function useReservationActions(
  storeId: string,
  cancelReservation: (id: string) => void,
  ctx: { services: ServiceMenu[]; staff: StaffMember[]; memberEmail?: string }
) {
  const router = useRouter();
  const storeName = initialStores.find((s) => s.id === storeId)?.name ?? "当店";

  function onCancel(r: Reservation) {
    if (window.confirm("この予約をキャンセルします。よろしいですか？")) {
      cancelReservation(r.id);
      // キャンセル確認メール（モック・実送信なし）。完了画面と同一フォーマット。
      const menuName = ctx.services.find((m) => m.id === r.serviceMenuId)?.name;
      const staffName = ctx.staff.find((s) => s.id === r.staffId)?.displayName;
      const email = buildReservationEmail("cancel", {
        storeName,
        receiptNo: r.id.replace(/^reservation-?/, ""),
        menuName,
        dateTimeLabel: `${r.date} ${r.startTime}〜`,
        staffName,
        customerName: r.customerName
      });
      const sent = ctx.memberEmail
        ? `確認メールを ${ctx.memberEmail} に送信しました（モック）。\n\n`
        : "（確認メールはモックのため送信されません）\n\n";
      window.alert(`${email.subject}\n\n${sent}${email.lines.join("\n")}`);
    }
  }
  function onChange(r: Reservation) {
    if (window.confirm("現在の予約をキャンセルして、新しく予約し直します。よろしいですか？")) {
      cancelReservation(r.id);
      router.push(`/book/${storeId}/reserve`);
    }
  }
  return { onCancel, onChange };
}

// ── ① マイページ ホーム ───────────────────────────────────────
export function MyPageHome({ storeId }: { storeId: string }) {
  const { member, myReservations, services, staff, cancelReservation } = useMyPageData();
  const { onCancel, onChange } = useReservationActions(storeId, cancelReservation, { services, staff, memberEmail: member?.email });
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
  const { member, myReservations, services, staff, cancelReservation } = useMyPageData();
  const { onCancel, onChange } = useReservationActions(storeId, cancelReservation, { services, staff, memberEmail: member?.email });

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
  const { member, updateMember } = useMyPageData();

  // 基本情報の編集（名前/電話/誕生日/メール）。編集→保存で localStorage に実保存。
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", birthDate: "", email: "" });

  function startEdit() {
    setForm({
      name: member?.name ?? "",
      phone: member?.phone ?? "",
      birthDate: member?.birthDate ?? "",
      email: member?.email ?? ""
    });
    setEditing(true);
  }
  function save() {
    updateMember({
      name: form.name.trim() || member?.name || "ゲスト",
      phone: form.phone.trim(),
      birthDate: form.birthDate,
      email: form.email.trim()
    });
    setEditing(false);
    window.alert("会員情報を保存しました。");
  }

  return (
    <MyPageShell storeId={storeId} tab="member">
      <section className="rounded-lg border border-luxas-line bg-white p-5">
        <h2 className="mb-3 text-base font-bold text-luxas-ink">会員情報</h2>
        {editing ? (
          <div className="space-y-3">
            <EditField label="お名前"><input className={memberInputCls} value={form.name} onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))} /></EditField>
            <EditField label="電話番号"><input className={memberInputCls} value={form.phone} onChange={(e) => setForm((c) => ({ ...c, phone: e.target.value }))} inputMode="tel" /></EditField>
            <EditField label="誕生日"><input type="date" className={memberInputCls} value={form.birthDate} onChange={(e) => setForm((c) => ({ ...c, birthDate: e.target.value }))} /></EditField>
            <EditField label="メールアドレス"><input className={memberInputCls} value={form.email} onChange={(e) => setForm((c) => ({ ...c, email: e.target.value }))} inputMode="email" /></EditField>
            <div className="flex justify-center gap-2 pt-1">
              <button type="button" onClick={save} className="rounded-md px-6 py-2.5 text-sm font-semibold text-white" style={{ backgroundColor: PM_NAVY }}>保存</button>
              <button type="button" onClick={() => setEditing(false)} className="rounded-md border border-luxas-line px-6 py-2.5 text-sm font-medium text-stone-600 hover:bg-luxas-mist/50">キャンセル</button>
            </div>
          </div>
        ) : (
          <>
            <dl className="divide-y divide-luxas-line">
              <Row label="お名前" value={member?.name || "-"} />
              <Row label="電話番号" value={member?.phone || "-"} />
              <Row label="誕生日" value={member?.birthDate ? formatJpDate(member.birthDate) : "-"} />
              <Row label="メールアドレス" value={member?.email || "-"} />
            </dl>
            <div className="mt-4 flex justify-center">
              <button type="button" onClick={startEdit} disabled={!member} className="rounded-md px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-40" style={{ backgroundColor: PM_NAVY }}>変更</button>
            </div>
          </>
        )}
      </section>

      <section className="rounded-lg border border-luxas-line bg-white p-5">
        <h2 className="mb-3 text-base font-bold text-luxas-ink">メールマガジン</h2>
        <dl className="divide-y divide-luxas-line">
          <ToggleRow label="重要なお知らせ" on={member?.acceptsEmail !== false} disabled={!member} onToggle={() => updateMember({ acceptsEmail: !(member?.acceptsEmail !== false) })} />
          <ToggleRow label="店舗メールマガジン" on={!!member?.acceptsDm} disabled={!member} onToggle={() => updateMember({ acceptsDm: !member?.acceptsDm })} />
        </dl>
        <p className="mt-2 text-[11px] text-stone-400">切り替えは即時保存されます。</p>
      </section>

      <section className="rounded-lg border border-luxas-line bg-white p-5">
        <h2 className="mb-3 text-base font-bold text-luxas-ink">アカウント情報</h2>
        <dl className="divide-y divide-luxas-line">
          <Row label="メールアドレス" value={member?.email || "-"} />
          <Row label="パスワード" value="********" />
        </dl>
        <p className="mt-3 text-center text-[11px] text-stone-400">パスワード変更は認証基盤の実装後に対応します（現在はモック）。</p>
      </section>
    </MyPageShell>
  );
}

const memberInputCls = "w-full rounded-md border border-luxas-line bg-white px-3 py-2 text-sm outline-none focus:border-luxas-green";

function EditField({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1 block text-xs font-medium text-stone-600">{label}</span>{children}</label>;
}

function ToggleRow({ label, on, disabled, onToggle }: { label: string; on: boolean; disabled?: boolean; onToggle: () => void }) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-3 py-3.5 text-sm">
      <dt className="text-stone-500">{label}</dt>
      <dd>
        <button
          type="button"
          onClick={onToggle}
          disabled={disabled}
          className={["rounded-full px-3 py-1 text-xs font-semibold disabled:opacity-40",
            on ? "bg-luxas-green text-white" : "border border-luxas-line bg-white text-stone-500"].join(" ")}
        >
          {on ? "受け取り" : "受け取らない"}
        </button>
      </dd>
    </div>
  );
}
