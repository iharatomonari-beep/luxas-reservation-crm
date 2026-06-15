"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { useLocalCollection } from "@/features/master-data/local-storage";
import {
  computeReservationPricing,
  initialOptions,
  initialServices,
  initialStaff,
  initialTags,
  optionsStorageKey,
  servicesStorageKey,
  staffStorageKey,
  tagsStorageKey
} from "@/features/master-data/mock-data";
import type { MasterTag, ServiceMenu, ServiceOption, StaffMember } from "@/features/master-data/types";
import { customersStorageKey, initialCustomers } from "@/features/customers/mock-data";
import { customerGenderLabels, type Customer } from "@/features/customers/types";
import { initialReservations, reservationsStorageKey } from "@/features/reservations/mock-data";
import { cancelTypeLabels, type Reservation } from "@/features/reservations/types";
import { formatDayLabel } from "@/features/reservations/date-utils";

function todayStr() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function ReservationList() {
  const [reservations] = useLocalCollection<Reservation>(reservationsStorageKey, initialReservations);
  const [staff] = useLocalCollection<StaffMember>(staffStorageKey, initialStaff);
  const [services] = useLocalCollection<ServiceMenu>(servicesStorageKey, initialServices);
  const [options] = useLocalCollection<ServiceOption>(optionsStorageKey, initialOptions);
  const [tags] = useLocalCollection<MasterTag>(tagsStorageKey, initialTags);
  const [customers] = useLocalCollection<Customer>(customersStorageKey, initialCustomers);
  const [date, setDate] = useState<string>(todayStr());
  const [query, setQuery] = useState("");

  const rows = useMemo(
    () =>
      reservations
        .filter((r) => r.date === date)
        .filter((r) => {
          const q = query.trim();
          if (!q) return true;
          return r.customerName.includes(q) || (r.phone ?? "").includes(q);
        })
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [reservations, date, query]
  );

  const routeTags = useMemo(() => tags.filter((t) => t.kind === "route"), [tags]);

  const staffName = (id: string) => staff.find((s) => s.id === id)?.displayName ?? "-";
  const serviceName = (id: string) => services.find((s) => s.id === id)?.name ?? "-";

  // 予約から顧客マスタを照合（電話優先・無ければ氏名）。
  function matchCustomer(r: Reservation): Customer | null {
    const phone = (r.phone ?? "").trim();
    if (phone) {
      const byPhone = customers.find((c) => (c.phone ?? "").trim() === phone);
      if (byPhone) return byPhone;
    }
    const name = r.customerName.trim();
    if (name && name !== "ゲスト") {
      return customers.find((c) => c.name.trim() === name) ?? null;
    }
    return null;
  }

  // 性別（顧客マスタから・無ければ「-」）。
  function genderLabel(r: Reservation): string {
    const c = matchCustomer(r);
    return c ? customerGenderLabels[c.gender] : "-";
  }

  // リピート回数（顧客マスタの累計来店数優先・無ければローカル予約から集計）。
  function repeatCount(r: Reservation): string {
    const c = matchCustomer(r);
    if (c?.totalVisits && c.totalVisits.trim()) return `${c.totalVisits}回`;
    const phone = (r.phone ?? "").trim();
    const name = r.customerName.trim();
    const count = reservations.filter((x) => {
      if (x.status === "canceled") return false;
      if (phone) return (x.phone ?? "").trim() === phone;
      return Boolean(name) && name !== "ゲスト" && x.customerName.trim() === name;
    }).length;
    return count > 0 ? `${count}回` : "-";
  }

  // 売上価格（確定 saleAmount があれば実値・無ければ見込）。
  function saleValue(r: Reservation): { text: string; estimate: boolean } {
    if (typeof r.saleAmount === "number") {
      return { text: `¥${r.saleAmount.toLocaleString()}`, estimate: false };
    }
    const svc = services.find((s) => s.id === r.serviceMenuId);
    if (!svc) return { text: "-", estimate: false };
    const pricing = computeReservationPricing(
      svc.price,
      r.optionIds,
      options,
      r.discountPercent,
      r.discountYen,
      r.bulkDiscountPercent,
      r.bulkDiscountYen
    );
    return { text: `¥${pricing.net.toLocaleString()}`, estimate: true };
  }

  // 予約経路（予約ルートタグから）。
  function routeLabel(r: Reservation): string {
    const names = (r.bookingTagIds ?? [])
      .map((id) => routeTags.find((t) => t.id === id)?.name)
      .filter((name): name is string => Boolean(name));
    return names.length ? names.join(", ") : "-";
  }

  // 総販売額（当日・会計確定 saleAmount の合計）。
  const totalSales = rows.reduce((sum, r) => sum + (r.saleAmount ?? 0), 0);

  return (
    <div className="space-y-4">
      <section className="flex flex-col gap-2 border-b border-luxas-line pb-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-luxas-green">Reservation List</p>
          <h1 className="mt-1 text-xl font-semibold text-luxas-ink">予約一覧</h1>
          <p className="mt-1 max-w-3xl text-sm leading-5 text-stone-600">
            日付ごとの予約を俯瞰できます。行をクリックすると予約台帳の該当日へ移動します。
          </p>
        </div>
        <Link
          href={`/dashboard/reservations?date=${date}`}
          className="inline-flex items-center justify-center gap-2 self-start rounded-md border border-luxas-line bg-white px-3.5 py-2 text-sm font-semibold text-luxas-ink transition hover:bg-luxas-paper"
        >
          <CalendarDays size={16} aria-hidden="true" />
          台帳で開く
        </Link>
      </section>

      <section className="rounded-lg border border-luxas-line bg-white">
        <div className="flex flex-wrap items-center gap-3 border-b border-luxas-line px-4 py-3">
          <label className="flex items-center gap-2 text-sm text-stone-700">
            <span className="font-medium">日付</span>
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="rounded-md border border-luxas-line bg-white px-2.5 py-1.5 text-sm text-luxas-ink outline-none focus:border-luxas-green"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-stone-700">
            <span className="font-medium">顧客名・電話</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="例: 森下 / 090..."
              className="rounded-md border border-luxas-line bg-white px-2.5 py-1.5 text-sm text-luxas-ink outline-none placeholder:text-stone-400 focus:border-luxas-green"
            />
          </label>
          <button
            type="button"
            disabled
            title="準備中"
            className="cursor-not-allowed rounded-md border border-luxas-line bg-white px-2.5 py-1.5 text-sm font-medium text-stone-300"
          >
            ＋ 検索条件追加
          </button>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <span className="rounded-md border border-luxas-line bg-luxas-paper px-2.5 py-1 font-medium text-luxas-ink">
              総販売額 ¥{totalSales.toLocaleString()}
            </span>
            <span className="text-stone-500">{rows.length}件</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-luxas-paper text-xs font-semibold uppercase tracking-normal text-stone-500">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">予約日</th>
                <th className="px-4 py-3">開始</th>
                <th className="px-4 py-3">顧客</th>
                <th className="px-4 py-3">性別</th>
                <th className="px-4 py-3">リピート</th>
                <th className="px-4 py-3">担当</th>
                <th className="px-4 py-3">コース</th>
                <th className="px-4 py-3">売上価格</th>
                <th className="px-4 py-3">会計状況</th>
                <th className="px-4 py-3">施術コメント</th>
                <th className="px-4 py-3">予約経路</th>
                <th className="px-4 py-3">キャンセル日時</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-luxas-line">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={13} className="px-4 py-8 text-center text-stone-500">
                    この条件の予約はありません。
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const sale = saleValue(r);
                  return (
                    <tr key={r.id} className="hover:bg-luxas-paper/60">
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-stone-400">{r.id.slice(0, 8)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-stone-700">{r.date}</td>
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-luxas-ink">
                        {r.startTime} - {r.endTime}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-luxas-ink">
                        <Link href={`/dashboard/reservations?date=${r.date}`} className="hover:text-luxas-green hover:underline">
                          {r.customerName}
                        </Link>
                        <span className="ml-2 text-xs text-stone-400">{r.phone || ""}</span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-stone-700">{genderLabel(r)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-stone-700">{repeatCount(r)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-stone-700">
                        {staffName(r.staffId)}
                        {r.nominatedStaffId ? <span className="ml-1 text-[10px] font-medium text-luxas-green">★指名</span> : null}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-stone-700">{serviceName(r.serviceMenuId)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-stone-700">
                        {sale.text}
                        {sale.estimate && sale.text !== "-" ? (
                          <span className="ml-1 text-[10px] font-medium text-stone-400">見込</span>
                        ) : null}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {r.paymentStatus === "paid" ? (
                          <span className="rounded-full bg-luxas-mist px-2 py-0.5 text-[11px] font-medium text-luxas-green">会計済</span>
                        ) : (
                          <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-500">未会計</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-stone-700">{r.memo?.trim() ? r.memo : "-"}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-stone-700">{routeLabel(r)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-stone-700">
                        {r.status === "canceled" && r.canceledAt ? (
                          <span>
                            {formatCancelDateTime(r.canceledAt)}
                            {r.cancelType && r.cancelType !== "none" ? (
                              <span className="ml-1 text-[10px] font-medium text-red-700">{cancelTypeLabels[r.cancelType]}</span>
                            ) : null}
                          </span>
                        ) : (
                          <span className="text-stone-400">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <p className="border-t border-luxas-line px-4 py-2 text-[11px] text-stone-400">
          ※ 性別・リピートは顧客マスタ照合（電話/氏名）、売上価格は会計確定額または見込、予約経路は予約ルートタグから表示。該当データが無い場合は「-」。日付は {formatDayLabel(date)}。
        </p>
      </section>
    </div>
  );
}

// ISO日時を「YYYY/MM/DD HH:mm」で表示（T041 キャンセル日時）。不正値はそのまま返す。
function formatCancelDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}
