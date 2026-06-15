"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { useLocalCollection } from "@/features/master-data/local-storage";
import { initialStaff, staffStorageKey } from "@/features/master-data/mock-data";
import type { StaffMember } from "@/features/master-data/types";
import { customersStorageKey, initialCustomers } from "@/features/customers/mock-data";
import { customerGenderLabels, type Customer } from "@/features/customers/types";
import { initialReservations, reservationsStorageKey } from "@/features/reservations/mock-data";
import { type PaymentMethod, type Reservation } from "@/features/reservations/types";
import { filterReservationsByStore } from "@/features/reservations/store-scope";
import { useCurrentStore } from "@/features/org/use-current-store";
import { formatDayLabel } from "@/features/reservations/date-utils";

function todayStr() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function yen(value: number) {
  return value > 0 ? `¥${value.toLocaleString()}` : "-";
}

export function PaymentsRegister() {
  const [reservations] = useLocalCollection<Reservation>(reservationsStorageKey, initialReservations);
  const [staff] = useLocalCollection<StaffMember>(staffStorageKey, initialStaff);
  const [customers] = useLocalCollection<Customer>(customersStorageKey, initialCustomers);
  const { currentStoreId } = useCurrentStore();
  const [date, setDate] = useState<string>(todayStr());
  const [query, setQuery] = useState("");

  // 現在店舗で安全フィルタ（T063）。
  const scopedReservations = useMemo(() => filterReservationsByStore(reservations, currentStoreId), [reservations, currentStoreId]);

  // 当日・会計確定（paymentStatus=paid もしくは payments あり）の予約のみ。
  const rows = useMemo(
    () =>
      scopedReservations
        .filter((r) => r.date === date)
        .filter((r) => r.paymentStatus === "paid" || (r.payments?.length ?? 0) > 0)
        .filter((r) => {
          const q = query.trim();
          if (!q) return true;
          return r.customerName.includes(q) || (r.phone ?? "").includes(q);
        })
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [scopedReservations, date, query]
  );

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

  const genderLabel = (r: Reservation) => {
    const c = matchCustomer(r);
    return c ? customerGenderLabels[c.gender] : "-";
  };
  const staffName = (id: string) => staff.find((s) => s.id === id)?.displayName ?? "-";

  const methodTotal = (r: Reservation, method: PaymentMethod) =>
    (r.payments ?? []).filter((p) => p.method === method).reduce((sum, p) => sum + p.amount, 0);

  const brandList = (r: Reservation, method: PaymentMethod, key: "cardBrand" | "emoneyBrand") => {
    const brands = Array.from(
      new Set(
        (r.payments ?? [])
          .filter((p) => p.method === method && p[key])
          .map((p) => p[key] as string)
      )
    );
    return brands.length ? brands.join(", ") : "-";
  };

  const rowTotal = (r: Reservation) =>
    typeof r.saleAmount === "number"
      ? r.saleAmount
      : (r.payments ?? []).reduce((sum, p) => sum + p.amount, 0);

  const totalSales = rows.reduce((sum, r) => sum + rowTotal(r), 0);

  return (
    <div className="space-y-4">
      <section className="flex flex-col gap-2 border-b border-luxas-line pb-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-luxas-green">Payments / Register</p>
          <h1 className="mt-1 text-xl font-semibold text-luxas-ink">支払・レジ一覧</h1>
          <p className="mt-1 max-w-3xl text-sm leading-5 text-stone-600">
            当日の会計確定データを支払方法別に俯瞰できます。会計（予約詳細→会計）で確定した内訳を表示します。
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
                <th className="px-3 py-3">ID</th>
                <th className="px-3 py-3">予約日</th>
                <th className="px-3 py-3">開始</th>
                <th className="px-3 py-3">顧客</th>
                <th className="px-3 py-3">性別</th>
                <th className="px-3 py-3">担当</th>
                <th className="px-3 py-3 text-right">総販売額</th>
                <th className="px-3 py-3 text-right">現金</th>
                <th className="px-3 py-3">クレカ種類</th>
                <th className="px-3 py-3 text-right">クレジット</th>
                <th className="px-3 py-3">電子マネー種類</th>
                <th className="px-3 py-3 text-right">電子マネー</th>
                <th className="px-3 py-3 text-right">回数券</th>
                <th className="px-3 py-3 text-right">商品券</th>
                <th className="px-3 py-3 text-right">プリペイド</th>
                <th className="px-3 py-3 text-right">ポイント</th>
                <th className="px-3 py-3 text-right">EPARK</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-luxas-line">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={17} className="px-4 py-8 text-center text-stone-500">
                    この日の会計確定データはありません。
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="hover:bg-luxas-paper/60">
                    <td className="whitespace-nowrap px-3 py-3 font-mono text-xs text-stone-400">{r.id.slice(0, 8)}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-stone-700">{r.date}</td>
                    <td className="whitespace-nowrap px-3 py-3 font-medium text-luxas-ink">{r.startTime}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-luxas-ink">
                      <Link href={`/dashboard/reservations?date=${r.date}`} className="hover:text-luxas-green hover:underline">
                        {r.customerName}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-stone-700">{genderLabel(r)}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-stone-700">{staffName(r.staffId)}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-right font-semibold text-luxas-ink">
                      ¥{rowTotal(r).toLocaleString()}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-right text-stone-700">{yen(methodTotal(r, "cash"))}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-stone-700">{brandList(r, "credit", "cardBrand")}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-right text-stone-700">{yen(methodTotal(r, "credit"))}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-stone-700">{brandList(r, "emoney", "emoneyBrand")}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-right text-stone-700">{yen(methodTotal(r, "emoney"))}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-right text-stone-700">{yen(methodTotal(r, "ticket"))}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-right text-stone-700">{yen(methodTotal(r, "giftcard"))}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-right text-stone-700">{yen(methodTotal(r, "prepaid"))}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-right text-stone-700">{yen(methodTotal(r, "point"))}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-right text-stone-700">{yen(methodTotal(r, "epark"))}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <p className="border-t border-luxas-line px-4 py-2 text-[11px] text-stone-400">
          ※ 会計（予約詳細→会計）で確定した payments[]/saleAmount を参照（保存形式は変更なし）。クレカ/電子マネー種類は会計時に選んだ決済マスタ名。日付は {formatDayLabel(date)}。
        </p>
      </section>
    </div>
  );
}
