"use client";

import { useMemo } from "react";
import { useLocalCollection } from "@/features/master-data/local-storage";
import { initialRetailSales, retailSalesStorageKey } from "@/features/master-data/mock-data";
import type { RetailSale } from "@/features/master-data/types";
import { initialReservations, reservationsStorageKey } from "@/features/reservations/mock-data";
import type { Reservation } from "@/features/reservations/types";
import { filterReservationsByStore } from "@/features/reservations/store-scope";
import { dailyTargetsStorageKey } from "@/features/master-data/monthly-shift-grid";
import { filterRecordsByStore } from "@/features/master-data/store-record-scope";
import { useCurrentStore } from "@/features/org/use-current-store";

type DailyTarget = { date: string; amount: number; comment: string; storeId?: string };
const EMPTY_TARGETS: DailyTarget[] = [];

export function TopKpi() {
  const [allReservations] = useLocalCollection<Reservation>(reservationsStorageKey, initialReservations);
  const [dailyTargets] = useLocalCollection<DailyTarget>(dailyTargetsStorageKey, EMPTY_TARGETS);
  const [retailSales] = useLocalCollection<RetailSale>(retailSalesStorageKey, initialRetailSales);
  const { currentStoreId } = useCurrentStore();
  // 現在店舗で安全フィルタ（T063）。
  const reservations = useMemo(() => filterReservationsByStore(allReservations, currentStoreId), [allReservations, currentStoreId]);

  const kpi = useMemo(() => {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const key = (r: Reservation) => r.phone.trim() || r.customerName.trim();

    const monthRes = reservations.filter((r) => r.date.startsWith(month) && r.status !== "canceled");
    const paid = monthRes.filter((r) => r.paymentStatus === "paid");
    const sales = paid.reduce((sum, r) => sum + (r.saleAmount ?? 0), 0);
    const visitors = new Set(monthRes.map((r) => r.customerName)).size;

    // 客単価 = 会計済売上 / 会計済の客数（重複客は1人で数える）。
    const paidCustomerKeys = new Set(paid.map(key).filter(Boolean));
    const avgPerCustomer = paidCustomerKeys.size > 0 ? Math.round(sales / paidCustomerKeys.size) : 0;

    // 新規/リピート: 当月来店客が、当月より前の会計済来店を持てばリピート（台帳と同一定義）。
    const historyKeys = new Set(
      reservations.filter((r) => r.paymentStatus === "paid" && r.date < `${month}-01`).map(key).filter(Boolean)
    );
    const monthVisitKeys = new Set(monthRes.map(key).filter(Boolean));
    let newCount = 0;
    let repeatCount = 0;
    for (const k of monthVisitKeys) {
      if (historyKeys.has(k)) repeatCount += 1;
      else newCount += 1;
    }

    // 月間目標 = 当月・現在店舗の日次目標の合計。達成度 = 売上 / 月間目標。
    const monthlyTarget = filterRecordsByStore(dailyTargets, currentStoreId)
      .filter((t) => t.date.startsWith(month))
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    const achievement = monthlyTarget > 0 ? Math.round((sales / monthlyTarget) * 100) : null;

    // 物販売上は施術売上（会計）と混ぜず独立集計（当月・現在店舗。未設定の既存データは既定店舗扱い）。
    const retailSalesTotal = filterRecordsByStore(retailSales, currentStoreId)
      .filter((s) => s.saleDate.startsWith(month))
      .reduce((sum, s) => sum + s.quantity * s.unitPrice, 0);

    return { sales, count: monthRes.length, visitors, paidCount: paid.length, avgPerCustomer, newCount, repeatCount, monthlyTarget, achievement, retailSalesTotal };
  }, [reservations, dailyTargets, retailSales, currentStoreId]);

  const cards = [
    { label: "当月売上（会計済）", value: `¥${kpi.sales.toLocaleString()}` },
    { label: "当月来店数", value: `${kpi.visitors}名` },
    { label: "客単価", value: `¥${kpi.avgPerCustomer.toLocaleString()}` },
    {
      label: "月間目標 / 達成度",
      value: kpi.monthlyTarget > 0 ? `¥${kpi.monthlyTarget.toLocaleString()} / ${kpi.achievement}%` : "未設定"
    },
    { label: "当月予約件数", value: `${kpi.count}件` },
    { label: "会計済件数", value: `${kpi.paidCount}件` },
    { label: "新規客", value: `${kpi.newCount}名` },
    { label: "リピート客", value: `${kpi.repeatCount}名` },
    { label: "当月物販売上（施術と別）", value: `¥${kpi.retailSalesTotal.toLocaleString()}` }
  ];

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((c) => (
        <div key={c.label} className="rounded-lg border border-luxas-line bg-white p-4">
          <p className="text-xs font-medium text-stone-500">{c.label}</p>
          <p className="mt-1 text-xl font-semibold text-luxas-ink">{c.value}</p>
        </div>
      ))}
      <p className="md:col-span-2 xl:col-span-4 text-[11px] text-stone-400">※ 売上・客単価・新規/リピートは会計（予約詳細→会計）確定分の当月集計。月間目標・達成度は月間シフトグリッドの日次目標の当月合計を参照（未入力なら「未設定」）。新規/リピート=来店客の過去の会計済来店有無で判定（電話番号優先）。物販売上は物販販売画面の登録分の当月・現在店舗合計で、施術売上（会計）とは別集計（二重計上を避けるため合算しない）。</p>
    </section>
  );
}
