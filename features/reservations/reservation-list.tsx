"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { useLocalCollection } from "@/features/master-data/local-storage";
import {
  initialServices,
  initialStaff,
  servicesStorageKey,
  staffStorageKey
} from "@/features/master-data/mock-data";
import type { ServiceMenu, StaffMember } from "@/features/master-data/types";
import { initialReservations, reservationsStorageKey } from "@/features/reservations/mock-data";
import { cancelTypeLabels, reservationStatusLabels, type Reservation } from "@/features/reservations/types";
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

  const staffName = (id: string) => staff.find((s) => s.id === id)?.displayName ?? "-";
  const serviceName = (id: string) => services.find((s) => s.id === id)?.name ?? "-";

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
          <span className="ml-auto text-sm text-stone-500">{rows.length}件</span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-luxas-paper text-xs font-semibold uppercase tracking-normal text-stone-500">
              <tr>
                <th className="px-4 py-3">開始</th>
                <th className="px-4 py-3">顧客</th>
                <th className="px-4 py-3">性別</th>
                <th className="px-4 py-3">リピート</th>
                <th className="px-4 py-3">担当</th>
                <th className="px-4 py-3">コース</th>
                <th className="px-4 py-3">会計</th>
                <th className="px-4 py-3">メモ</th>
                <th className="px-4 py-3">予約経路</th>
                <th className="px-4 py-3">状態</th>
                <th className="px-4 py-3">キャンセル日時</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-luxas-line">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-stone-500">
                    この条件の予約はありません。
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="hover:bg-luxas-paper/60">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-luxas-ink">
                      {r.startTime} - {r.endTime}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-luxas-ink">
                      <Link href={`/dashboard/reservations?date=${r.date}`} className="hover:text-luxas-green hover:underline">
                        {r.customerName}
                      </Link>
                      <span className="ml-2 text-xs text-stone-400">{r.phone || ""}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-stone-400">-</td>
                    <td className="whitespace-nowrap px-4 py-3 text-stone-400">-</td>
                    <td className="whitespace-nowrap px-4 py-3 text-stone-700">
                      {staffName(r.staffId)}
                      {r.nominatedStaffId ? <span className="ml-1 text-[10px] font-medium text-luxas-green">★指名</span> : null}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-stone-700">{serviceName(r.serviceMenuId)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-stone-400">-</td>
                    <td className="whitespace-nowrap px-4 py-3 text-stone-700">{r.memo?.trim() ? "あり" : "-"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-stone-400">-</td>
                    <td className="whitespace-nowrap px-4 py-3 text-stone-700">{reservationStatusLabels[r.status]}</td>
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
                ))
              )}
            </tbody>
          </table>
        </div>
        <p className="border-t border-luxas-line px-4 py-2 text-[11px] text-stone-400">
          ※ 性別・リピート・会計・予約経路は対応データ/会計機能が未実装のため「-」表示です（要確認）。日付は {formatDayLabel(date)}。
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
