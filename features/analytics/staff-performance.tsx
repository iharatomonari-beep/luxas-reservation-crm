"use client";

import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { MasterPage } from "@/features/master-data/master-page";
import { useLocalCollection } from "@/features/master-data/local-storage";
import { initialStaff, staffStorageKey } from "@/features/master-data/mock-data";
import type { StaffMember } from "@/features/master-data/types";
import { initialReservations, reservationsStorageKey } from "@/features/reservations/mock-data";
import type { Reservation } from "@/features/reservations/types";
import { filterReservationsByStore } from "@/features/reservations/store-scope";
import { useCurrentStore } from "@/features/org/use-current-store";
import { serializeCsv } from "@/features/import-export/csv-utils";

/** 並び替えキー。既定は売上降順。 */
type SortKey = "sales" | "served" | "nominated" | "nominationRate" | "avg" | "newCount";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "sales", label: "売上" },
  { key: "served", label: "施術件数" },
  { key: "nominated", label: "指名数" },
  { key: "nominationRate", label: "指名率" },
  { key: "avg", label: "客単価" },
  { key: "newCount", label: "新規数" }
];

type StaffRow = {
  staffId: string;
  name: string;
  served: number;
  nominated: number;
  nominationRate: number;
  customers: number;
  newCount: number;
  repeatCount: number;
  sales: number;
  avg: number;
  noShow: number;
};

function yen(value: number) {
  return `¥${value.toLocaleString()}`;
}

function pct(value: number) {
  return `${Math.round(value * 100)}%`;
}

/** 顧客識別キー（顧客ID優先・無ければ電話／氏名）。会計済集計の同一人物判定に使う。 */
function customerKey(reservation: Reservation) {
  return reservation.customerId?.trim() || reservation.phone?.trim() || reservation.customerName.trim();
}

function downloadCsv(fileName: string, headers: string[], records: Array<Record<string, string | number>>) {
  const csv = serializeCsv(headers, records);
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export function StaffPerformance() {
  const [allReservations] = useLocalCollection<Reservation>(reservationsStorageKey, initialReservations);
  const { currentStoreId } = useCurrentStore();
  // 現在店舗で安全フィルタ（T063）。以降の集計はすべて現在店舗基準。
  const reservations = useMemo(() => filterReservationsByStore(allReservations, currentStoreId), [allReservations, currentStoreId]);
  const [staff] = useLocalCollection<StaffMember>(staffStorageKey, initialStaff);

  const now = new Date();
  const [month, setMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
  const [sort, setSort] = useState<SortKey>("sales");

  const staffName = useMemo(() => new Map(staff.map((s) => [s.id, s.displayName])), [staff]);

  // 当月の施術（キャンセル・休憩/業務ブロックは除外）。件数・指名の母数。
  const monthServed = useMemo(
    () => reservations.filter((r) => r.date.startsWith(month) && r.status !== "canceled" && !r.blockType),
    [reservations, month]
  );
  // 当月の会計済（売上・客単価・新規/リピートの母数）。
  const monthPaid = useMemo(() => monthServed.filter((r) => r.paymentStatus === "paid"), [monthServed]);

  // 顧客ごとの初回会計月（新規/リピート判定の基準。店舗スコープ済み全期間）。
  const firstMonthByKey = useMemo(() => {
    const map = new Map<string, string>();
    const paidSorted = reservations
      .filter((r) => r.paymentStatus === "paid" && r.status !== "canceled" && !r.blockType)
      .sort((a, b) => a.date.localeCompare(b.date));
    for (const r of paidSorted) {
      const key = customerKey(r);
      if (!key || map.has(key)) continue;
      map.set(key, r.date.slice(0, 7));
    }
    return map;
  }, [reservations]);

  const rows = useMemo<StaffRow[]>(() => {
    type Acc = {
      served: number;
      nominated: number;
      customers: Set<string>;
      newKeys: Set<string>;
      sales: number;
      noShow: number;
    };
    const acc = new Map<string, Acc>();
    const ensure = (id: string) => {
      if (!acc.has(id)) acc.set(id, { served: 0, nominated: 0, customers: new Set(), newKeys: new Set(), sales: 0, noShow: 0 });
      return acc.get(id)!;
    };

    for (const r of monthServed) {
      const a = ensure(r.staffId);
      a.served += 1;
      if (r.nominatedStaffId && r.nominatedStaffId === r.staffId) a.nominated += 1;
    }
    for (const r of monthPaid) {
      const a = ensure(r.staffId);
      a.sales += r.saleAmount ?? 0;
      const key = customerKey(r);
      if (key) {
        a.customers.add(key);
        if (firstMonthByKey.get(key) === month) a.newKeys.add(key);
      }
    }
    // 無断キャンセル（当月・担当別）。施術には含まれないため別途集計。
    for (const r of reservations) {
      if (r.date.startsWith(month) && r.cancelType === "no_show") ensure(r.staffId).noShow += 1;
    }

    const result: StaffRow[] = [...acc.entries()].map(([staffId, a]) => {
      const customers = a.customers.size;
      const newCount = a.newKeys.size;
      return {
        staffId,
        name: staffName.get(staffId) ?? staffId,
        served: a.served,
        nominated: a.nominated,
        nominationRate: a.served > 0 ? a.nominated / a.served : 0,
        customers,
        newCount,
        repeatCount: customers - newCount,
        sales: a.sales,
        avg: customers > 0 ? Math.round(a.sales / customers) : 0,
        noShow: a.noShow
      };
    });

    return result.sort((x, y) => {
      const v = y[sort] - x[sort];
      return v !== 0 ? v : y.sales - x.sales;
    });
  }, [monthServed, monthPaid, reservations, firstMonthByKey, month, staffName, sort]);

  // 合計（フッター行）。
  const totals = useMemo(() => {
    const t = rows.reduce(
      (sum, r) => ({
        served: sum.served + r.served,
        nominated: sum.nominated + r.nominated,
        customers: sum.customers + r.customers,
        newCount: sum.newCount + r.newCount,
        repeatCount: sum.repeatCount + r.repeatCount,
        sales: sum.sales + r.sales,
        noShow: sum.noShow + r.noShow
      }),
      { served: 0, nominated: 0, customers: 0, newCount: 0, repeatCount: 0, sales: 0, noShow: 0 }
    );
    return {
      ...t,
      nominationRate: t.served > 0 ? t.nominated / t.served : 0,
      avg: t.customers > 0 ? Math.round(t.sales / t.customers) : 0
    };
  }, [rows]);

  const headers = ["スタッフ", "施術件数", "指名数", "指名率", "来店客数", "新規", "リピート", "売上", "客単価", "無断キャンセル"];

  const inputClass = "rounded-md border border-luxas-line bg-white px-2.5 py-1.5 text-sm outline-none focus:border-luxas-green";

  return (
    <MasterPage
      title="スタッフ成績"
      description="スタッフ別の施術件数・指名・来店客数・売上・客単価などを月単位で集計します。CSVに書き出せます。"
    >
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-stone-700">
          <span className="font-medium">対象月</span>
          <input type="month" className={inputClass} value={month} onChange={(e) => setMonth(e.target.value)} />
        </label>
        <label className="flex items-center gap-2 text-sm text-stone-700">
          <span className="font-medium">並び替え</span>
          <select className={inputClass} value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
            {SORTS.map((s) => (
              <option key={s.key} value={s.key}>{s.label}（降順）</option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() =>
            downloadCsv(
              `スタッフ成績_${month}.csv`,
              headers,
              rows.map((r) => ({
                スタッフ: r.name,
                施術件数: r.served,
                指名数: r.nominated,
                指名率: pct(r.nominationRate),
                来店客数: r.customers,
                新規: r.newCount,
                リピート: r.repeatCount,
                売上: r.sales,
                客単価: r.avg,
                無断キャンセル: r.noShow
              }))
            )
          }
          disabled={rows.length === 0}
          className="ml-auto inline-flex items-center gap-2 rounded-md border border-luxas-line bg-white px-3 py-2 text-sm font-medium text-luxas-ink transition hover:bg-luxas-paper disabled:cursor-not-allowed disabled:text-stone-300"
        >
          <Download size={16} aria-hidden="true" />
          CSV出力
        </button>
      </div>

      <section className="rounded-lg border border-luxas-line bg-white">
        <div className="border-b border-luxas-line px-5 py-4">
          <h2 className="text-base font-semibold text-luxas-ink">スタッフ別成績（{month}）</h2>
          <p className="mt-1 text-sm text-stone-500">対象 {rows.length} 名</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-luxas-paper text-xs font-semibold text-stone-500">
              <tr>
                {headers.map((col, i) => (
                  <th key={col} className={["px-4 py-3", i === 0 ? "" : "text-right"].join(" ")}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-luxas-line">
              {rows.map((r) => (
                <tr key={r.staffId}>
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-luxas-ink">{r.name}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-stone-700">{r.served}件</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-stone-700">{r.nominated}件</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-stone-700">{pct(r.nominationRate)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-stone-700">{r.customers}名</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-stone-700">{r.newCount}名</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-stone-700">{r.repeatCount}名</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-luxas-ink">{yen(r.sales)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-stone-700">{yen(r.avg)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-stone-700">{r.noShow}件</td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={headers.length} className="px-5 py-8 text-center text-sm text-stone-500">
                    当月の予約・会計データがありません。
                  </td>
                </tr>
              ) : (
                <tr className="bg-luxas-paper font-semibold text-luxas-ink">
                  <td className="whitespace-nowrap px-4 py-3">合計</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">{totals.served}件</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">{totals.nominated}件</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">{pct(totals.nominationRate)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">{totals.customers}名</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">{totals.newCount}名</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">{totals.repeatCount}名</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">{yen(totals.sales)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">{yen(totals.avg)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">{totals.noShow}件</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <p className="mt-4 text-[11px] text-stone-400">
        ※ 施術件数はキャンセル・休憩/業務ブロックを除く当月予約。売上・客単価・新規/リピートは会計確定分のみ。指名数は「現担当を指名固定」した予約。新規＝当月が初回会計月の顧客。無断キャンセルは当月の担当別。現在店舗のみ集計。
      </p>
    </MasterPage>
  );
}
